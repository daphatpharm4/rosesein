alter table public.profiles
  add column if not exists difficult_day_mode boolean not null default false;

alter table public.notification_preferences
  add column if not exists email_enabled boolean not null default false,
  add column if not exists push_enabled boolean not null default false;

alter table public.community_threads
  add column if not exists is_anonymous boolean not null default false;

create table if not exists public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  bucket_id text not null default 'parcours-documents',
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_kind text not null check (request_kind in ('export', 'deletion', 'correction')),
  details text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  target_kind text not null,
  target_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.association_engagement_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_kind text not null check (
    request_kind in ('membership', 'donation', 'volunteer', 'mentorship', 'support')
  ),
  name text not null,
  email text,
  phone text,
  message text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_documents_user_id_created_at_idx
  on public.user_documents (user_id, created_at desc);

create index if not exists privacy_requests_user_id_created_at_idx
  on public.privacy_requests (user_id, created_at desc);

create index if not exists push_subscriptions_user_id_created_at_idx
  on public.push_subscriptions (user_id, created_at desc);

create index if not exists admin_audit_logs_actor_id_created_at_idx
  on public.admin_audit_logs (actor_id, created_at desc);

create index if not exists association_engagement_requests_user_id_created_at_idx
  on public.association_engagement_requests (user_id, created_at desc);

drop trigger if exists set_privacy_requests_updated_at on public.privacy_requests;
create trigger set_privacy_requests_updated_at
before update on public.privacy_requests
for each row
execute function public.set_updated_at();

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists set_association_engagement_requests_updated_at on public.association_engagement_requests;
create trigger set_association_engagement_requests_updated_at
before update on public.association_engagement_requests
for each row
execute function public.set_updated_at();

alter table public.user_documents enable row level security;
alter table public.privacy_requests enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.association_engagement_requests enable row level security;

drop policy if exists "community_threads_insert_staff" on public.community_threads;
drop policy if exists "community_threads_insert_own" on public.community_threads;
create policy "community_threads_insert_own"
  on public.community_threads for insert
  with check (auth.uid() = created_by);

drop policy if exists "community_threads_update_own_or_staff" on public.community_threads;
create policy "community_threads_update_own_or_staff"
  on public.community_threads for update
  using (
    auth.uid() = created_by
    or public.has_role('moderator')
    or public.has_role('admin')
  )
  with check (
    auth.uid() = created_by
    or public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "community_threads_delete_own_or_staff" on public.community_threads;
create policy "community_threads_delete_own_or_staff"
  on public.community_threads for delete
  using (
    auth.uid() = created_by
    or public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "roles_insert_admin" on public.user_roles;
create policy "roles_insert_admin"
  on public.user_roles for insert
  with check (public.has_role('admin'));

drop policy if exists "roles_delete_admin" on public.user_roles;
create policy "roles_delete_admin"
  on public.user_roles for delete
  using (public.has_role('admin'));

drop policy if exists "user_documents_select_own" on public.user_documents;
create policy "user_documents_select_own"
  on public.user_documents for select
  using (
    auth.uid() = user_id
    or public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "user_documents_insert_own" on public.user_documents;
create policy "user_documents_insert_own"
  on public.user_documents for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_documents_delete_own" on public.user_documents;
create policy "user_documents_delete_own"
  on public.user_documents for delete
  using (
    auth.uid() = user_id
    or public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "privacy_requests_select_own_or_staff" on public.privacy_requests;
create policy "privacy_requests_select_own_or_staff"
  on public.privacy_requests for select
  using (
    auth.uid() = user_id
    or public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "privacy_requests_insert_own" on public.privacy_requests;
create policy "privacy_requests_insert_own"
  on public.privacy_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "privacy_requests_update_staff" on public.privacy_requests;
create policy "privacy_requests_update_staff"
  on public.privacy_requests for update
  using (
    public.has_role('moderator')
    or public.has_role('admin')
  )
  with check (
    public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

drop policy if exists "admin_audit_logs_select_staff" on public.admin_audit_logs;
create policy "admin_audit_logs_select_staff"
  on public.admin_audit_logs for select
  using (
    public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "admin_audit_logs_insert_staff" on public.admin_audit_logs;
create policy "admin_audit_logs_insert_staff"
  on public.admin_audit_logs for insert
  with check (
    actor_id = auth.uid()
    and (
      public.has_role('moderator')
      or public.has_role('admin')
    )
  );

drop policy if exists "association_engagement_requests_select_own_or_staff" on public.association_engagement_requests;
create policy "association_engagement_requests_select_own_or_staff"
  on public.association_engagement_requests for select
  using (
    auth.uid() = user_id
    or public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists "association_engagement_requests_insert_own" on public.association_engagement_requests;
create policy "association_engagement_requests_insert_own"
  on public.association_engagement_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "association_engagement_requests_update_staff" on public.association_engagement_requests;
create policy "association_engagement_requests_update_staff"
  on public.association_engagement_requests for update
  using (
    public.has_role('moderator')
    or public.has_role('admin')
  )
  with check (
    public.has_role('moderator')
    or public.has_role('admin')
  );

insert into storage.buckets (id, name, public)
values ('parcours-documents', 'parcours-documents', false)
on conflict (id) do nothing;

drop policy if exists "documents_bucket_select_own" on storage.objects;
create policy "documents_bucket_select_own"
  on storage.objects for select
  using (
    bucket_id = 'parcours-documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents_bucket_insert_own" on storage.objects;
create policy "documents_bucket_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'parcours-documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents_bucket_update_own" on storage.objects;
create policy "documents_bucket_update_own"
  on storage.objects for update
  using (
    bucket_id = 'parcours-documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'parcours-documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents_bucket_delete_own" on storage.objects;
create policy "documents_bucket_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'parcours-documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.open_direct_conversation(candidate_target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  existing_thread_id uuid;
  new_thread_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if candidate_target_user_id is null or candidate_target_user_id = actor_id then
    raise exception 'Invalid target user';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = candidate_target_user_id
  ) then
    raise exception 'Target profile not found';
  end if;

  select thread.id
  into existing_thread_id
  from public.conversation_threads thread
  where thread.kind = 'direct'
    and exists (
      select 1 from public.thread_participants self_participant
      where self_participant.thread_id = thread.id
        and self_participant.user_id = actor_id
    )
    and exists (
      select 1 from public.thread_participants target_participant
      where target_participant.thread_id = thread.id
        and target_participant.user_id = candidate_target_user_id
    )
    and (
      select count(*)
      from public.thread_participants participant_count
      where participant_count.thread_id = thread.id
    ) = 2
  limit 1;

  if existing_thread_id is not null then
    return existing_thread_id;
  end if;

  insert into public.conversation_threads (kind, created_by, is_official)
  values ('direct', actor_id, false)
  returning id into new_thread_id;

  insert into public.thread_participants (thread_id, user_id)
  values
    (new_thread_id, actor_id),
    (new_thread_id, candidate_target_user_id)
  on conflict do nothing;

  return new_thread_id;
end;
$$;

create or replace function public.ensure_association_thread(candidate_target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  existing_thread_id uuid;
  new_thread_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not (
    public.has_role('moderator')
    or public.has_role('admin')
  ) then
    raise exception 'Staff role required';
  end if;

  if candidate_target_user_id is null then
    raise exception 'Target user required';
  end if;

  select thread.id
  into existing_thread_id
  from public.conversation_threads thread
  where thread.kind = 'association'
    and thread.is_official = true
    and exists (
      select 1 from public.thread_participants target_participant
      where target_participant.thread_id = thread.id
        and target_participant.user_id = candidate_target_user_id
    )
  order by thread.updated_at desc
  limit 1;

  if existing_thread_id is not null then
    if not exists (
      select 1 from public.thread_participants
      where thread_id = existing_thread_id
        and user_id = actor_id
    ) then
      insert into public.thread_participants (thread_id, user_id)
      values (existing_thread_id, actor_id)
      on conflict do nothing;
    end if;

    return existing_thread_id;
  end if;

  insert into public.conversation_threads (kind, title, created_by, is_official)
  values ('association', 'Association ROSE-SEIN', actor_id, true)
  returning id into new_thread_id;

  insert into public.thread_participants (thread_id, user_id)
  values
    (new_thread_id, actor_id),
    (new_thread_id, candidate_target_user_id)
  on conflict do nothing;

  return new_thread_id;
end;
$$;

create or replace function public.search_member_directory(search_query text default '')
returns table (
  user_id uuid,
  visible_name text,
  profile_kind public.profile_kind,
  is_anonymous boolean,
  has_existing_thread boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with actor as (
    select auth.uid() as viewer_id
  )
  select
    profile.id as user_id,
    case
      when profile.is_anonymous and profile.pseudonym is not null then profile.pseudonym
      else profile.display_name
    end as visible_name,
    profile.profile_kind,
    profile.is_anonymous,
    exists (
      select 1
      from public.thread_participants self_participant
      join public.thread_participants target_participant
        on target_participant.thread_id = self_participant.thread_id
      join public.conversation_threads thread
        on thread.id = self_participant.thread_id
      where self_participant.user_id = (select viewer_id from actor)
        and target_participant.user_id = profile.id
        and thread.kind = 'direct'
    ) as has_existing_thread
  from public.profiles profile
  cross join actor
  where actor.viewer_id is not null
    and profile.id <> actor.viewer_id
    and (
      nullif(trim(coalesce(search_query, '')), '') is null
      or lower(profile.display_name) like '%' || lower(trim(search_query)) || '%'
      or lower(coalesce(profile.pseudonym, '')) like '%' || lower(trim(search_query)) || '%'
    )
  order by has_existing_thread desc, visible_name asc
  limit 40;
$$;
