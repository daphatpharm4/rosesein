do $$
begin
  create type public.event_kind as enum ('evenement', 'atelier', 'webinaire');
exception
  when duplicate_object then null;
end $$;

alter table public.events
  add column if not exists event_kind public.event_kind not null default 'evenement',
  add column if not exists professional_id uuid references public.professional_profiles(id) on delete set null;

create index if not exists events_professional_id_starts_at_idx
  on public.events (professional_id, starts_at asc);

alter table public.events
  drop constraint if exists events_professional_kind_consistency;

alter table public.events
  add constraint events_professional_kind_consistency
  check (
    professional_id is null
    or event_kind in ('atelier', 'webinaire')
  );

drop policy if exists "events_staff_select_all" on public.events;
create policy "events_staff_select_all"
  on public.events for select
  using (
    public.has_role('moderator')
    or public.has_role('admin')
    or professional_id = auth.uid()
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

drop policy if exists "events_partner_insert_own" on public.events;
create policy "events_partner_insert_own"
  on public.events for insert
  with check (
    professional_id = auth.uid()
    and event_kind in ('atelier', 'webinaire')
    and exists (
      select 1
      from public.professional_profiles professional
      where professional.id = auth.uid()
        and professional.is_active = true
        and professional.subscription_tier = 'partenaire'
    )
  );

drop policy if exists "events_partner_update_own" on public.events;
create policy "events_partner_update_own"
  on public.events for update
  using (
    professional_id = auth.uid()
    and exists (
      select 1
      from public.professional_profiles professional
      where professional.id = auth.uid()
        and professional.is_active = true
        and professional.subscription_tier = 'partenaire'
    )
  )
  with check (
    professional_id = auth.uid()
    and event_kind in ('atelier', 'webinaire')
    and exists (
      select 1
      from public.professional_profiles professional
      where professional.id = auth.uid()
        and professional.is_active = true
        and professional.subscription_tier = 'partenaire'
    )
  );

drop policy if exists "event_registrations_select_own_or_staff" on public.event_registrations;
create policy "event_registrations_select_own_or_staff"
  on public.event_registrations for select
  using (
    auth.uid() = user_id
    or public.has_role('moderator')
    or public.has_role('admin')
    or exists (
      select 1
      from public.events
      where public.events.id = event_registrations.event_id
        and public.events.professional_id = auth.uid()
    )
  );
