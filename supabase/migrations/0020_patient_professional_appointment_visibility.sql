drop policy if exists "profiles_select_booked_professionals" on public.profiles;
create policy "profiles_select_booked_professionals"
on public.profiles
for select
using (
  exists (
    select 1
    from public.professional_appointments appointment
    where appointment.patient_id = auth.uid()
      and appointment.professional_id = profiles.id
  )
);

drop policy if exists "professional_profiles_select_patient_booked" on public.professional_profiles;
create policy "professional_profiles_select_patient_booked"
on public.professional_profiles
for select
using (
  exists (
    select 1
    from public.professional_appointments appointment
    where appointment.patient_id = auth.uid()
      and appointment.professional_id = professional_profiles.id
  )
);
