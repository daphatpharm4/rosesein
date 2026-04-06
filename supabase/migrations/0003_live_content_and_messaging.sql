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

drop trigger if exists touch_conversation_thread_on_message_insert on public.messages;
create trigger touch_conversation_thread_on_message_insert
after insert on public.messages
for each row
execute function public.touch_thread_updated_at();

drop policy if exists "profiles_select_thread_participants_or_staff" on public.profiles;
create policy "profiles_select_thread_participants_or_staff"
on public.profiles
for select
using (
  auth.uid() = id
  or public.shares_thread_with(id)
  or public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "threads_visible_to_participants_or_staff" on public.conversation_threads;
create policy "threads_visible_to_participants_or_staff"
on public.conversation_threads
for select
using (
  public.is_thread_participant(id)
  or public.has_role('moderator')
  or public.has_role('admin')
);

drop policy if exists "participants_visible_to_thread_participants_or_staff" on public.thread_participants;
drop policy if exists "participants_visible_to_self_or_staff" on public.thread_participants;
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
