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
