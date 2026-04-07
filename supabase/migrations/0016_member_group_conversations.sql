create or replace function public.open_group_conversation(
  candidate_member_ids uuid[],
  candidate_group_title text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  normalized_member_ids uuid[];
  new_thread_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(coalesce(candidate_group_title, '')), '') is null then
    raise exception 'Group title required';
  end if;

  normalized_member_ids := array(
    select distinct member.member_id
    from unnest(coalesce(candidate_member_ids, array[]::uuid[])) as member(member_id)
    where member.member_id is not null
      and member.member_id <> actor_id
  );

  if coalesce(array_length(normalized_member_ids, 1), 0) < 2 then
    raise exception 'At least two members required';
  end if;

  if exists (
    select 1
    from unnest(normalized_member_ids) as member(member_id)
    where not exists (
      select 1
      from public.profiles
      where id = member.member_id
    )
  ) then
    raise exception 'Target profile not found';
  end if;

  insert into public.conversation_threads (kind, title, created_by, is_official)
  values ('group', trim(candidate_group_title), actor_id, false)
  returning id into new_thread_id;

  insert into public.thread_participants (thread_id, user_id)
  select new_thread_id, participant_id
  from (
    select actor_id as participant_id
    union
    select unnest(normalized_member_ids)
  ) participants
  on conflict do nothing;

  return new_thread_id;
end;
$$;
