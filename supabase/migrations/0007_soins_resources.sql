-- supabase/migrations/0007_soins_resources.sql

do $$ begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'resource_category') then
    create type public.resource_category as enum ('nutrition', 'activite', 'beaute', 'psychologie');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'resource_format') then
    create type public.resource_format as enum ('article', 'video', 'exercise');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'resource_difficulty') then
    create type public.resource_difficulty as enum ('gentle', 'moderate', 'active');
  end if;
end $$;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  category public.resource_category not null,
  title text not null,
  summary text not null,
  content jsonb not null default '[]'::jsonb,
  format public.resource_format not null default 'article',
  difficulty public.resource_difficulty not null default 'gentle',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists resources_category_published_idx
  on public.resources (category, published_at desc);

drop trigger if exists set_resources_updated_at on public.resources;
create trigger set_resources_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();

alter table public.resources enable row level security;

drop policy if exists "resources_select_published" on public.resources;
create policy "resources_select_published"
  on public.resources for select
  using (published_at is not null and published_at <= timezone('utc', now()));

drop policy if exists "resources_insert_staff" on public.resources;
create policy "resources_insert_staff"
  on public.resources for insert
  with check (public.has_role('admin') or public.has_role('moderator'));

drop policy if exists "resources_update_staff" on public.resources;
create policy "resources_update_staff"
  on public.resources for update
  using (public.has_role('admin') or public.has_role('moderator'));
