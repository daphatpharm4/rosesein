create or replace function public.can_access_community_kind(required_kind public.community_kind)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      required_kind = 'all'
      or public.has_role('moderator')
      or public.has_role('admin')
      or exists (
        select 1
        from public.profiles profile
        where profile.id = auth.uid()
          and profile.profile_kind::text = required_kind::text
      )
    );
$$;

create or replace function public.can_access_community_space(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_spaces space
    where space.id = target_space_id
      and space.is_active = true
      and public.can_access_community_kind(space.allowed_kind)
  );
$$;

create or replace function public.can_access_community_thread(target_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_threads thread
    where thread.id = target_thread_id
      and public.can_access_community_space(thread.space_id)
  );
$$;

create or replace function public.can_access_community_reply(target_reply_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_replies reply
    where reply.id = target_reply_id
      and public.can_access_community_thread(reply.thread_id)
  );
$$;

drop policy if exists "community_threads_select_auth" on public.community_threads;
create policy "community_threads_select_auth"
  on public.community_threads for select
  using (public.can_access_community_space(space_id));

drop policy if exists "community_spaces_select_active" on public.community_spaces;
create policy "community_spaces_select_active"
  on public.community_spaces for select
  using (
    is_active = true
    and public.can_access_community_kind(allowed_kind)
  );

drop policy if exists "community_threads_insert_own" on public.community_threads;
create policy "community_threads_insert_own"
  on public.community_threads for insert
  with check (
    auth.uid() = created_by
    and public.can_access_community_space(space_id)
  );

drop policy if exists "community_threads_update_own_or_staff" on public.community_threads;
create policy "community_threads_update_own_or_staff"
  on public.community_threads for update
  using (
    (auth.uid() = created_by or public.has_role('moderator') or public.has_role('admin'))
    and public.can_access_community_space(space_id)
  )
  with check (
    (auth.uid() = created_by or public.has_role('moderator') or public.has_role('admin'))
    and public.can_access_community_space(space_id)
  );

drop policy if exists "community_threads_delete_own_or_staff" on public.community_threads;
create policy "community_threads_delete_own_or_staff"
  on public.community_threads for delete
  using (
    (auth.uid() = created_by or public.has_role('moderator') or public.has_role('admin'))
    and public.can_access_community_space(space_id)
  );

drop policy if exists "community_replies_select_auth" on public.community_replies;
create policy "community_replies_select_auth"
  on public.community_replies for select
  using (public.can_access_community_thread(thread_id));

drop policy if exists "community_replies_insert_own" on public.community_replies;
create policy "community_replies_insert_own"
  on public.community_replies for insert
  with check (
    auth.uid() = author_id
    and public.can_access_community_thread(thread_id)
  );

drop policy if exists "thread_reactions_select_auth" on public.community_thread_reactions;
create policy "thread_reactions_select_auth"
  on public.community_thread_reactions for select
  using (public.can_access_community_thread(thread_id));

drop policy if exists "thread_reactions_insert_own" on public.community_thread_reactions;
create policy "thread_reactions_insert_own"
  on public.community_thread_reactions for insert
  with check (
    auth.uid() = user_id
    and public.can_access_community_thread(thread_id)
  );

drop policy if exists "thread_reactions_update_own" on public.community_thread_reactions;
create policy "thread_reactions_update_own"
  on public.community_thread_reactions for update
  using (
    auth.uid() = user_id
    and public.can_access_community_thread(thread_id)
  )
  with check (
    auth.uid() = user_id
    and public.can_access_community_thread(thread_id)
  );

drop policy if exists "thread_reactions_delete_own" on public.community_thread_reactions;
create policy "thread_reactions_delete_own"
  on public.community_thread_reactions for delete
  using (
    auth.uid() = user_id
    and public.can_access_community_thread(thread_id)
  );

drop policy if exists "reply_reactions_select_auth" on public.community_reply_reactions;
create policy "reply_reactions_select_auth"
  on public.community_reply_reactions for select
  using (public.can_access_community_reply(reply_id));

drop policy if exists "reply_reactions_insert_own" on public.community_reply_reactions;
create policy "reply_reactions_insert_own"
  on public.community_reply_reactions for insert
  with check (
    auth.uid() = user_id
    and public.can_access_community_reply(reply_id)
  );

drop policy if exists "reply_reactions_update_own" on public.community_reply_reactions;
create policy "reply_reactions_update_own"
  on public.community_reply_reactions for update
  using (
    auth.uid() = user_id
    and public.can_access_community_reply(reply_id)
  )
  with check (
    auth.uid() = user_id
    and public.can_access_community_reply(reply_id)
  );

drop policy if exists "reply_reactions_delete_own" on public.community_reply_reactions;
create policy "reply_reactions_delete_own"
  on public.community_reply_reactions for delete
  using (
    auth.uid() = user_id
    and public.can_access_community_reply(reply_id)
  );
