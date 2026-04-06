create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'profile_kind'
  ) then
    create type public.profile_kind as enum ('patient', 'caregiver');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'platform_role'
  ) then
    create type public.platform_role as enum ('member', 'moderator', 'admin');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'thread_kind'
  ) then
    create type public.thread_kind as enum ('association', 'direct', 'group', 'mentorship');
  end if;
end
$$;

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

create or replace function public.is_thread_participant(candidate_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.thread_participants
    where thread_id = candidate_thread_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.shares_thread_with(candidate_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.thread_participants self_participant
    join public.thread_participants target_participant
      on target_participant.thread_id = self_participant.thread_id
    where self_participant.user_id = auth.uid()
      and target_participant.user_id = candidate_user_id
  );
$$;

create or replace function public.touch_thread_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversation_threads
  set updated_at = timezone('utc', now())
  where id = new.thread_id;

  return new;
end;
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

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_articles_updated_at on public.articles;
create trigger set_articles_updated_at
before update on public.articles
for each row
execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

drop trigger if exists set_conversation_threads_updated_at on public.conversation_threads;
create trigger set_conversation_threads_updated_at
before update on public.conversation_threads
for each row
execute function public.set_updated_at();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

drop trigger if exists touch_conversation_thread_on_message_insert on public.messages;
create trigger touch_conversation_thread_on_message_insert
after insert on public.messages
for each row
execute function public.touch_thread_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.articles enable row level security;
alter table public.events enable row level security;
alter table public.conversation_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff"
on public.profiles
for select
using (
  auth.uid() = id
  or public.shares_thread_with(id)
  or public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "roles_select_own_or_admin" on public.user_roles;
create policy "roles_select_own_or_admin"
on public.user_roles
for select
using (
  auth.uid() = user_id
  or public.has_role('admin')
);

drop policy if exists "articles_public_read_published" on public.articles;
create policy "articles_public_read_published"
on public.articles
for select
using (published_at is not null);

drop policy if exists "events_public_read_published" on public.events;
create policy "events_public_read_published"
on public.events
for select
using (published_at is not null);

drop policy if exists "threads_visible_to_participants_or_staff" on public.conversation_threads;
create policy "threads_visible_to_participants_or_staff"
on public.conversation_threads
for select
using (
  public.is_thread_participant(id)
  or public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "participants_visible_to_self_or_staff" on public.thread_participants;
drop policy if exists "participants_visible_to_thread_participants_or_staff" on public.thread_participants;
create policy "participants_visible_to_thread_participants_or_staff"
on public.thread_participants
for select
using (
  public.is_thread_participant(thread_id)
  or public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "messages_visible_to_thread_participants_or_staff" on public.messages;
create policy "messages_visible_to_thread_participants_or_staff"
on public.messages
for select
using (
  public.is_thread_participant(thread_id)
  or public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "messages_insert_by_thread_participant" on public.messages;
create policy "messages_insert_by_thread_participant"
on public.messages
for insert
with check (
  sender_id = auth.uid()
  and public.is_thread_participant(thread_id)
);

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
on public.notification_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "notification_preferences_upsert_own" on public.notification_preferences;
create policy "notification_preferences_upsert_own"
on public.notification_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "roles_insert_member_self" on public.user_roles;
create policy "roles_insert_member_self"
on public.user_roles
for insert
with check (
  auth.uid() = user_id
  and role = 'member'
);

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own"
on public.notification_preferences
for insert
with check (auth.uid() = user_id);

drop policy if exists "threads_insert_staff" on public.conversation_threads;
create policy "threads_insert_staff"
on public.conversation_threads
for insert
with check (
  public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "participants_insert_staff" on public.thread_participants;
create policy "participants_insert_staff"
on public.thread_participants
for insert
with check (
  public.has_role('moderator')
  or public.has_role('admin')
);

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'report_target_kind'
  ) then
    create type public.report_target_kind as enum ('message');
  end if;

  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'report_reason'
  ) then
    create type public.report_reason as enum (
      'abuse',
      'misinformation',
      'privacy',
      'impersonation',
      'other'
    );
  end if;

  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'report_status'
  ) then
    create type public.report_status as enum ('open', 'reviewing', 'resolved', 'escalated');
  end if;

  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'report_severity'
  ) then
    create type public.report_severity as enum ('low', 'medium', 'high', 'severe');
  end if;

  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'moderation_action_type'
  ) then
    create type public.moderation_action_type as enum (
      'review_note',
      'warn_member',
      'close_report',
      'escalate'
    );
  end if;
end
$$;

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_kind public.report_target_kind not null default 'message',
  thread_id uuid not null references public.conversation_threads(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  reason public.report_reason not null,
  details text,
  status public.report_status not null default 'open',
  severity public.report_severity not null default 'medium',
  escalation_target text,
  escalation_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.content_reports(id) on delete cascade,
  moderator_id uuid not null references auth.users(id) on delete cascade,
  action_type public.moderation_action_type not null,
  notes text,
  escalation_target text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_content_reports_updated_at on public.content_reports;
create trigger set_content_reports_updated_at
before update on public.content_reports
for each row
execute function public.set_updated_at();

create or replace function public.can_access_message(candidate_message_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.messages
    join public.thread_participants
      on thread_participants.thread_id = messages.thread_id
    where messages.id = candidate_message_id
      and thread_participants.user_id = auth.uid()
  );
$$;

create or replace function public.message_matches_thread(
  candidate_message_id uuid,
  candidate_thread_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.messages
    where id = candidate_message_id
      and thread_id = candidate_thread_id
  );
$$;

create or replace function public.apply_moderation_action(
  candidate_report_id uuid,
  candidate_action_type public.moderation_action_type,
  candidate_notes text default null,
  candidate_escalation_target text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  next_status public.report_status;
  inserted_action_id uuid;
begin
  if not (public.has_role('moderator') or public.has_role('admin')) then
    raise exception 'moderation access required';
  end if;

  if candidate_action_type = 'close_report' then
    next_status := 'resolved';
  elsif candidate_action_type = 'escalate' then
    next_status := 'escalated';
  else
    next_status := 'reviewing';
  end if;

  if candidate_action_type = 'escalate'
     and coalesce(trim(candidate_escalation_target), '') = '' then
    raise exception 'escalation target required';
  end if;

  update public.content_reports
  set
    status = next_status,
    reviewed_by = actor_id,
    reviewed_at = timezone('utc', now()),
    escalation_target = case
      when candidate_action_type = 'escalate' then candidate_escalation_target
      else escalation_target
    end,
    escalation_notes = case
      when candidate_action_type = 'escalate' then candidate_notes
      else escalation_notes
    end,
    severity = case
      when candidate_action_type = 'escalate' then 'severe'::public.report_severity
      else severity
    end
  where id = candidate_report_id;

  if not found then
    raise exception 'report not found';
  end if;

  insert into public.moderation_actions (
    report_id,
    moderator_id,
    action_type,
    notes,
    escalation_target
  )
  values (
    candidate_report_id,
    actor_id,
    candidate_action_type,
    candidate_notes,
    case
      when candidate_action_type = 'escalate' then candidate_escalation_target
      else null
    end
  )
  returning id into inserted_action_id;

  return inserted_action_id;
end;
$$;

create or replace function public.append_report_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, entity_type, entity_id, action, metadata)
  values (
    new.reporter_id,
    'content_report',
    new.id,
    'report_created',
    jsonb_build_object(
      'thread_id', new.thread_id,
      'message_id', new.message_id,
      'reason', new.reason,
      'severity', new.severity
    )
  );

  return new;
end;
$$;

create or replace function public.append_moderation_action_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, entity_type, entity_id, action, metadata)
  values (
    new.moderator_id,
    'moderation_action',
    new.id,
    'moderation_action_recorded',
    jsonb_build_object(
      'report_id', new.report_id,
      'action_type', new.action_type,
      'escalation_target', new.escalation_target
    )
  );

  return new;
end;
$$;

drop trigger if exists audit_content_reports_insert on public.content_reports;
create trigger audit_content_reports_insert
after insert on public.content_reports
for each row
execute function public.append_report_audit_log();

drop trigger if exists audit_moderation_actions_insert on public.moderation_actions;
create trigger audit_moderation_actions_insert
after insert on public.moderation_actions
for each row
execute function public.append_moderation_action_audit_log();

alter table public.content_reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "content_reports_select_own_or_staff" on public.content_reports;
create policy "content_reports_select_own_or_staff"
on public.content_reports
for select
using (
  reporter_id = auth.uid()
  or public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "content_reports_insert_by_participant" on public.content_reports;
create policy "content_reports_insert_by_participant"
on public.content_reports
for insert
with check (
  reporter_id = auth.uid()
  and target_kind = 'message'
  and public.is_thread_participant(thread_id)
  and public.can_access_message(message_id)
  and public.message_matches_thread(message_id, thread_id)
);

drop policy if exists "content_reports_update_by_staff" on public.content_reports;
create policy "content_reports_update_by_staff"
on public.content_reports
for update
using (
  public.has_role('moderator')
  or public.has_role('admin')
)
with check (
  public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "moderation_actions_select_staff" on public.moderation_actions;
create policy "moderation_actions_select_staff"
on public.moderation_actions
for select
using (
  public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "moderation_actions_insert_staff" on public.moderation_actions;
create policy "moderation_actions_insert_staff"
on public.moderation_actions
for insert
with check (
  moderator_id = auth.uid()
  and (
    public.has_role('moderator')
    or public.has_role('admin')
  )
);

drop policy if exists "audit_log_select_staff" on public.audit_log;
create policy "audit_log_select_staff"
on public.audit_log
for select
using (
  public.has_role('moderator')
  or public.has_role('admin')
);
