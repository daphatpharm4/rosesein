create extension if not exists pgcrypto;

create type public.profile_kind as enum ('patient', 'caregiver');
create type public.platform_role as enum ('member', 'moderator', 'admin');
create type public.thread_kind as enum ('association', 'direct', 'group', 'mentorship');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  profile_kind public.profile_kind not null,
  display_name text not null,
  pseudonym text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.platform_role not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, role)
);

create or replace function public.has_role(required_role public.platform_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = required_role
  );
$$;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  category text not null,
  content jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  validated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_label text,
  created_by uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  kind public.thread_kind not null,
  title text,
  created_by uuid references auth.users(id),
  is_official boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.thread_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  unique (thread_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  messages_enabled boolean not null default true,
  replies_enabled boolean not null default true,
  news_enabled boolean not null default true,
  events_enabled boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_articles_updated_at
before update on public.articles
for each row
execute function public.set_updated_at();

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create trigger set_conversation_threads_updated_at
before update on public.conversation_threads
for each row
execute function public.set_updated_at();

create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.articles enable row level security;
alter table public.events enable row level security;
alter table public.conversation_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notification_preferences enable row level security;

create policy "profiles_select_own_or_staff"
on public.profiles
for select
using (
  auth.uid() = id
  or public.has_role('moderator')
  or public.has_role('admin')
);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "roles_select_own_or_admin"
on public.user_roles
for select
using (
  auth.uid() = user_id
  or public.has_role('admin')
);

create policy "articles_public_read_published"
on public.articles
for select
using (published_at is not null);

create policy "events_public_read_published"
on public.events
for select
using (published_at is not null);

create policy "threads_visible_to_participants_or_staff"
on public.conversation_threads
for select
using (
  exists (
    select 1
    from public.thread_participants participant
    where participant.thread_id = id
      and participant.user_id = auth.uid()
  )
  or public.has_role('moderator')
  or public.has_role('admin')
);

create policy "participants_visible_to_self_or_staff"
on public.thread_participants
for select
using (
  auth.uid() = user_id
  or public.has_role('moderator')
  or public.has_role('admin')
);

create policy "messages_visible_to_thread_participants_or_staff"
on public.messages
for select
using (
  exists (
    select 1
    from public.thread_participants participant
    where participant.thread_id = messages.thread_id
      and participant.user_id = auth.uid()
  )
  or public.has_role('moderator')
  or public.has_role('admin')
);

create policy "messages_insert_by_thread_participant"
on public.messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.thread_participants participant
    where participant.thread_id = messages.thread_id
      and participant.user_id = auth.uid()
  )
);

create policy "notification_preferences_select_own"
on public.notification_preferences
for select
using (auth.uid() = user_id);

create policy "notification_preferences_upsert_own"
on public.notification_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
