-- supabase/migrations/0014_admin_collective_messaging.sql

-- 1. admin_broadcasts — tracks each broadcast event
create table if not exists public.admin_broadcasts (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null,
  body            text not null,
  segment         text not null check (segment in ('all', 'patient', 'caregiver')),
  recipient_count int not null default 0,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default timezone('utc', now())
);

create index if not exists admin_broadcasts_created_at_idx
  on public.admin_broadcasts (created_at desc);

alter table public.admin_broadcasts enable row level security;

drop policy if exists "admin_broadcasts_select_staff" on public.admin_broadcasts;
create policy "admin_broadcasts_select_staff"
  on public.admin_broadcasts for select
  using (public.has_role('admin') or public.has_role('moderator'));

drop policy if exists "admin_broadcasts_insert_staff" on public.admin_broadcasts;
create policy "admin_broadcasts_insert_staff"
  on public.admin_broadcasts for insert
  with check (public.has_role('admin') or public.has_role('moderator'));

-- 2. has_role_for_user — needed by send_broadcast to exclude staff from recipients
create or replace function public.has_role_for_user(
  p_user_id uuid,
  p_role    public.platform_role
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id
      and role = p_role
  );
$$;

-- 3. send_broadcast — bulk creates one thread+participants+message per recipient
create or replace function public.send_broadcast(
  p_subject   text,
  p_body      text,
  p_segment   text,
  p_sender_id uuid
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient  record;
  v_thread_id  uuid;
  v_count      int := 0;
begin
  if p_segment not in ('all', 'patient', 'caregiver') then
    raise exception 'Invalid segment: %', p_segment;
  end if;

  for v_recipient in
    select p.id
    from public.profiles p
    where (
      p_segment = 'all'
      or (p_segment = 'patient'   and p.profile_kind = 'patient'::public.profile_kind)
      or (p_segment = 'caregiver' and p.profile_kind = 'caregiver'::public.profile_kind)
    )
    and not public.has_role_for_user(p.id, 'admin')
    and not public.has_role_for_user(p.id, 'moderator')
  loop
    insert into public.conversation_threads (kind, title, is_official, created_by)
    values ('association', null, true, p_sender_id)
    returning id into v_thread_id;

    -- Recipient participant
    insert into public.thread_participants (thread_id, user_id)
    values (v_thread_id, v_recipient.id);

    -- Sender participant (so replies appear in staff inbox)
    insert into public.thread_participants (thread_id, user_id)
    values (v_thread_id, p_sender_id)
    on conflict (thread_id, user_id) do nothing;

    insert into public.messages (thread_id, sender_id, body)
    values (v_thread_id, p_sender_id, p_body);

    v_count := v_count + 1;
  end loop;

  insert into public.admin_broadcasts (subject, body, segment, recipient_count, created_by)
  values (p_subject, p_body, p_segment, v_count, p_sender_id);

  return v_count;
end;
$$;
