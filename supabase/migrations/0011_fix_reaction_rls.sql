-- supabase/migrations/0011_fix_reaction_rls.sql
-- Fix: add WITH CHECK to UPDATE policies on reaction tables

drop policy if exists "thread_reactions_update_own" on public.community_thread_reactions;
create policy "thread_reactions_update_own"
  on public.community_thread_reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reply_reactions_update_own" on public.community_reply_reactions;
create policy "reply_reactions_update_own"
  on public.community_reply_reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
