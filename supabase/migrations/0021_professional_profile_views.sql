create table if not exists public.professional_profile_views (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  viewed_on date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  constraint professional_profile_views_viewer_daily_unique
    unique (professional_id, viewer_id, viewed_on)
);

create index if not exists professional_profile_views_professional_created_at_idx
  on public.professional_profile_views (professional_id, created_at desc);

create index if not exists professional_profile_views_professional_viewed_on_idx
  on public.professional_profile_views (professional_id, viewed_on desc);

alter table public.professional_profile_views enable row level security;

create policy "professional_profile_views_insert_public"
  on public.professional_profile_views
  for insert
  with check (
    exists (
      select 1
      from public.professional_profiles
      where professional_profiles.id = professional_profile_views.professional_id
        and professional_profiles.is_active = true
    )
  );

create policy "professional_profile_views_select_owner"
  on public.professional_profile_views
  for select
  using (
    professional_id = auth.uid()
    or public.has_role('admin')
  );
