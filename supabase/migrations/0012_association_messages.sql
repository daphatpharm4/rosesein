-- supabase/migrations/0012_association_messages.sql

create table if not exists public.association_messages (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists association_messages_expires_at_idx
  on public.association_messages (expires_at desc);

alter table public.association_messages enable row level security;

drop policy if exists "assoc_messages_select" on public.association_messages;
create policy "assoc_messages_select"
  on public.association_messages for select
  using (expires_at > timezone('utc', now()));

drop policy if exists "assoc_messages_insert_staff" on public.association_messages;
create policy "assoc_messages_insert_staff"
  on public.association_messages for insert
  with check (public.has_role('admin') or public.has_role('moderator'));
