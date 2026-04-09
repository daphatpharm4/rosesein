do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'appointment_status'
  ) then
    create type public.appointment_status as enum (
      'pending',
      'confirmed',
      'declined',
      'cancelled',
      'completed'
    );
  end if;
end
$$;

create table if not exists public.professional_availabilities (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  consultation_mode public.consultation_mode not null default 'presentiel',
  is_published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint professional_availabilities_non_empty check (ends_at > starts_at)
);

create index if not exists professional_availabilities_professional_starts_at_idx
  on public.professional_availabilities (professional_id, starts_at);

create table if not exists public.professional_appointments (
  id uuid primary key default gen_random_uuid(),
  availability_id uuid not null references public.professional_availabilities(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  status public.appointment_status not null default 'pending',
  patient_note text,
  professional_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists professional_appointments_professional_status_idx
  on public.professional_appointments (professional_id, status, created_at desc);

create index if not exists professional_appointments_patient_idx
  on public.professional_appointments (patient_id, created_at desc);

create unique index if not exists professional_appointments_active_availability_idx
  on public.professional_appointments (availability_id)
  where status in ('pending', 'confirmed', 'completed');

drop policy if exists "profiles_select_professional_patients" on public.profiles;
create policy "profiles_select_professional_patients"
on public.profiles
for select
using (
  exists (
    select 1
    from public.professional_appointments appointment
    where appointment.patient_id = profiles.id
      and appointment.professional_id = auth.uid()
  )
);

drop trigger if exists set_professional_appointments_updated_at on public.professional_appointments;
create trigger set_professional_appointments_updated_at
before update on public.professional_appointments
for each row
execute function public.set_updated_at();

alter table public.professional_availabilities enable row level security;
alter table public.professional_appointments enable row level security;

drop policy if exists "availabilities_select_published" on public.professional_availabilities;
create policy "availabilities_select_published"
on public.professional_availabilities
for select
using (is_published = true);

drop policy if exists "availabilities_select_own" on public.professional_availabilities;
create policy "availabilities_select_own"
on public.professional_availabilities
for select
using (professional_id = auth.uid() or created_by = auth.uid());

drop policy if exists "availabilities_manage_own" on public.professional_availabilities;
create policy "availabilities_manage_own"
on public.professional_availabilities
for all
using (professional_id = auth.uid() or created_by = auth.uid())
with check (professional_id = auth.uid() or created_by = auth.uid());

drop policy if exists "availabilities_admin_all" on public.professional_availabilities;
create policy "availabilities_admin_all"
on public.professional_availabilities
for all
using (public.has_role('admin'));

drop policy if exists "appointments_select_patient" on public.professional_appointments;
create policy "appointments_select_patient"
on public.professional_appointments
for select
using (patient_id = auth.uid());

drop policy if exists "appointments_select_professional" on public.professional_appointments;
create policy "appointments_select_professional"
on public.professional_appointments
for select
using (professional_id = auth.uid());

drop policy if exists "appointments_insert_patient" on public.professional_appointments;
create policy "appointments_insert_patient"
on public.professional_appointments
for insert
with check (
  patient_id = auth.uid()
  and exists (
    select 1
    from public.professional_availabilities availability
    where availability.id = availability_id
      and availability.professional_id = professional_id
      and availability.is_published = true
  )
);

drop policy if exists "appointments_update_professional" on public.professional_appointments;
create policy "appointments_update_professional"
on public.professional_appointments
for update
using (professional_id = auth.uid())
with check (professional_id = auth.uid());

drop policy if exists "appointments_admin_all" on public.professional_appointments;
create policy "appointments_admin_all"
on public.professional_appointments
for all
using (public.has_role('admin'));
