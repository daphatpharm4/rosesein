do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'appointment_actor'
  ) then
    create type public.appointment_actor as enum ('patient', 'professional', 'admin');
  end if;
end
$$;

alter table public.professional_appointments
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by public.appointment_actor,
  add column if not exists cancellation_reason text,
  add column if not exists late_cancellation boolean not null default false;

create index if not exists professional_appointments_patient_late_cancellation_idx
  on public.professional_appointments (patient_id, cancelled_at desc)
  where cancelled_by = 'patient' and late_cancellation = true;

create or replace function public.cancel_professional_appointment(
  target_appointment_id uuid,
  cancellation_reason_input text
)
returns public.professional_appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  appointment_row public.professional_appointments%rowtype;
  appointment_start timestamptz;
  actor public.appointment_actor;
  trimmed_reason text := nullif(btrim(cancellation_reason_input), '');
  is_late boolean := false;
begin
  if auth.uid() is null then
    raise exception 'APPOINTMENT_FORBIDDEN';
  end if;

  if trimmed_reason is null or char_length(trimmed_reason) < 8 then
    raise exception 'CANCELLATION_REASON_REQUIRED';
  end if;

  select appointment.*
  into appointment_row
  from public.professional_appointments appointment
  where appointment.id = target_appointment_id;

  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND';
  end if;

  select availability.starts_at
  into appointment_start
  from public.professional_availabilities availability
  where availability.id = appointment_row.availability_id;

  if public.has_role('admin') then
    actor := 'admin';
  elsif appointment_row.patient_id = auth.uid() then
    actor := 'patient';
  elsif appointment_row.professional_id = auth.uid() then
    actor := 'professional';
  else
    raise exception 'APPOINTMENT_FORBIDDEN';
  end if;

  if appointment_row.status not in ('pending', 'confirmed') then
    raise exception 'APPOINTMENT_STATUS_INVALID';
  end if;

  if actor = 'patient'
     and appointment_row.status = 'confirmed'
     and appointment_start < timezone('utc', now()) + interval '24 hours' then
    raise exception 'PATIENT_CANCELLATION_WINDOW_CLOSED';
  end if;

  if appointment_row.status = 'confirmed'
     and appointment_start < timezone('utc', now()) + interval '48 hours' then
    is_late := true;
  end if;

  update public.professional_appointments
  set
    status = 'cancelled',
    cancelled_at = timezone('utc', now()),
    cancelled_by = actor,
    cancellation_reason = trimmed_reason,
    late_cancellation = is_late
  where id = target_appointment_id
  returning * into appointment_row;

  return appointment_row;
end;
$$;

revoke all on function public.cancel_professional_appointment(uuid, text) from public;
grant execute on function public.cancel_professional_appointment(uuid, text) to authenticated;
