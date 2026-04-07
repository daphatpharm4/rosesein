do $$
begin
  create type public.event_registration_status as enum ('registered', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_email text,
  contact_phone text,
  note text,
  status public.event_registration_status not null default 'registered',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (event_id, user_id)
);

create index if not exists event_registrations_event_id_created_at_idx
  on public.event_registrations (event_id, created_at desc);

create index if not exists event_registrations_user_id_created_at_idx
  on public.event_registrations (user_id, created_at desc);

drop trigger if exists set_event_registrations_updated_at on public.event_registrations;
create trigger set_event_registrations_updated_at
before update on public.event_registrations
for each row
execute function public.set_updated_at();

alter table public.event_registrations enable row level security;

drop policy if exists "events_staff_select_all" on public.events;
create policy "events_staff_select_all"
  on public.events for select
  using (
    public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "events_staff_insert" on public.events;
create policy "events_staff_insert"
  on public.events for insert
  with check (
    public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "events_staff_update" on public.events;
create policy "events_staff_update"
  on public.events for update
  using (
    public.has_role('moderator')
    or public.has_role('admin')
  )
  with check (
    public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "event_registrations_select_own_or_staff" on public.event_registrations;
create policy "event_registrations_select_own_or_staff"
  on public.event_registrations for select
  using (
    auth.uid() = user_id
    or public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "event_registrations_insert_own" on public.event_registrations;
create policy "event_registrations_insert_own"
  on public.event_registrations for insert
  with check (
    auth.uid() = user_id
    and status = 'registered'
    and exists (
      select 1
      from public.events
      where public.events.id = event_id
        and public.events.published_at is not null
    )
  );

drop policy if exists "event_registrations_update_own_or_staff" on public.event_registrations;
create policy "event_registrations_update_own_or_staff"
  on public.event_registrations for update
  using (
    auth.uid() = user_id
    or public.has_role('moderator')
    or public.has_role('admin')
  )
  with check (
    auth.uid() = user_id
    or public.has_role('moderator')
    or public.has_role('admin')
  );
