do $$ begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'community_kind') then
    create type public.community_kind as enum ('patient', 'caregiver', 'all');
  end if;
end $$;

create table if not exists public.community_spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon_name text not null default 'Users',
  allowed_kind public.community_kind not null default 'all',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_threads (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.community_spaces(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_threads_space_id_idx
  on public.community_threads (space_id, pinned desc, created_at desc);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_replies_thread_id_idx
  on public.community_replies (thread_id, created_at asc);

drop trigger if exists set_community_threads_updated_at on public.community_threads;
create trigger set_community_threads_updated_at
  before update on public.community_threads
  for each row execute function public.set_updated_at();

alter table public.community_spaces enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_replies enable row level security;

drop policy if exists "community_spaces_select_active" on public.community_spaces;
create policy "community_spaces_select_active"
  on public.community_spaces for select
  using (is_active = true);

drop policy if exists "community_spaces_insert_staff" on public.community_spaces;
create policy "community_spaces_insert_staff"
  on public.community_spaces for insert
  with check (public.has_role('admin') or public.has_role('moderator'));

drop policy if exists "community_threads_select_auth" on public.community_threads;
create policy "community_threads_select_auth"
  on public.community_threads for select
  using (auth.uid() is not null);

drop policy if exists "community_threads_insert_staff" on public.community_threads;
create policy "community_threads_insert_staff"
  on public.community_threads for insert
  with check (public.has_role('admin') or public.has_role('moderator'));

drop policy if exists "community_replies_select_auth" on public.community_replies;
create policy "community_replies_select_auth"
  on public.community_replies for select
  using (auth.uid() is not null);

drop policy if exists "community_replies_insert_own" on public.community_replies;
create policy "community_replies_insert_own"
  on public.community_replies for insert
  with check (auth.uid() = author_id);
