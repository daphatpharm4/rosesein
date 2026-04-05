-- supabase/migrations/0010_community_reactions.sql

do $$ begin
  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace and typname = 'reaction_kind'
  ) then
    create type public.reaction_kind as enum ('touche', 'pense', 'courage', 'merci');
  end if;
end $$;

create table if not exists public.community_thread_reactions (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.community_threads(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       public.reaction_kind not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (thread_id, user_id)
);

create index if not exists community_thread_reactions_thread_id_idx
  on public.community_thread_reactions (thread_id);

create table if not exists public.community_reply_reactions (
  id         uuid primary key default gen_random_uuid(),
  reply_id   uuid not null references public.community_replies(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       public.reaction_kind not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (reply_id, user_id)
);

create index if not exists community_reply_reactions_reply_id_idx
  on public.community_reply_reactions (reply_id);

-- RLS
alter table public.community_thread_reactions enable row level security;
alter table public.community_reply_reactions enable row level security;

drop policy if exists "thread_reactions_select_auth" on public.community_thread_reactions;
create policy "thread_reactions_select_auth"
  on public.community_thread_reactions for select using (auth.uid() is not null);

drop policy if exists "thread_reactions_insert_own" on public.community_thread_reactions;
create policy "thread_reactions_insert_own"
  on public.community_thread_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "thread_reactions_update_own" on public.community_thread_reactions;
create policy "thread_reactions_update_own"
  on public.community_thread_reactions for update
  using (auth.uid() = user_id);

drop policy if exists "thread_reactions_delete_own" on public.community_thread_reactions;
create policy "thread_reactions_delete_own"
  on public.community_thread_reactions for delete
  using (auth.uid() = user_id);

drop policy if exists "reply_reactions_select_auth" on public.community_reply_reactions;
create policy "reply_reactions_select_auth"
  on public.community_reply_reactions for select using (auth.uid() is not null);

drop policy if exists "reply_reactions_insert_own" on public.community_reply_reactions;
create policy "reply_reactions_insert_own"
  on public.community_reply_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "reply_reactions_update_own" on public.community_reply_reactions;
create policy "reply_reactions_update_own"
  on public.community_reply_reactions for update
  using (auth.uid() = user_id);

drop policy if exists "reply_reactions_delete_own" on public.community_reply_reactions;
create policy "reply_reactions_delete_own"
  on public.community_reply_reactions for delete
  using (auth.uid() = user_id);
