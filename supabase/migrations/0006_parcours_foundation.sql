create table if not exists public.user_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  scheduled_for timestamp not null,
  location_label text,
  contact_label text,
  details text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_appointments_user_id_scheduled_for_idx
on public.user_appointments (user_id, scheduled_for);

create table if not exists public.personal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists personal_notes_user_id_updated_at_idx
on public.personal_notes (user_id, updated_at desc);

drop trigger if exists set_user_appointments_updated_at on public.user_appointments;
create trigger set_user_appointments_updated_at
before update on public.user_appointments
for each row
execute function public.set_updated_at();

drop trigger if exists set_personal_notes_updated_at on public.personal_notes;
create trigger set_personal_notes_updated_at
before update on public.personal_notes
for each row
execute function public.set_updated_at();

alter table public.user_appointments enable row level security;
alter table public.personal_notes enable row level security;

drop policy if exists "user_appointments_select_own" on public.user_appointments;
create policy "user_appointments_select_own"
on public.user_appointments
for select
using (auth.uid() = user_id);

drop policy if exists "user_appointments_insert_own" on public.user_appointments;
create policy "user_appointments_insert_own"
on public.user_appointments
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_appointments_update_own" on public.user_appointments;
create policy "user_appointments_update_own"
on public.user_appointments
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_appointments_delete_own" on public.user_appointments;
create policy "user_appointments_delete_own"
on public.user_appointments
for delete
using (auth.uid() = user_id);

drop policy if exists "personal_notes_select_own" on public.personal_notes;
create policy "personal_notes_select_own"
on public.personal_notes
for select
using (auth.uid() = user_id);

drop policy if exists "personal_notes_insert_own" on public.personal_notes;
create policy "personal_notes_insert_own"
on public.personal_notes
for insert
with check (auth.uid() = user_id);

drop policy if exists "personal_notes_update_own" on public.personal_notes;
create policy "personal_notes_update_own"
on public.personal_notes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "personal_notes_delete_own" on public.personal_notes;
create policy "personal_notes_delete_own"
on public.personal_notes
for delete
using (auth.uid() = user_id);
