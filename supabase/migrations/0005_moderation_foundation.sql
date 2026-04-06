do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'report_target_kind'
  ) then
    create type public.report_target_kind as enum ('message');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'report_reason'
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
    select 1 from pg_type where typname = 'report_status'
  ) then
    create type public.report_status as enum ('open', 'reviewing', 'resolved', 'escalated');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'report_severity'
  ) then
    create type public.report_severity as enum ('low', 'medium', 'high', 'severe');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'moderation_action_type'
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
