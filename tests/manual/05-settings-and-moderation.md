# Manual Test 05: Settings and Moderation

## Goal

Confirm that `/parametres` writes to Supabase and that message reports flow into the moderation queue.

## Preconditions

- local app running with `.env.local`
- migrations through `0005_moderation_foundation.sql` applied
- one moderator or admin test account exists
- at least one message exists in a thread shared with a member test account

## Settings Steps

1. Sign in with a member account that already completed profile bootstrap
2. Open `/parametres`
3. Change the display name or pseudonym
4. Toggle at least one notification preference
5. Save both forms
6. Refresh `/parametres`

## Settings Expected Results

- profile updates persist
- notification preferences persist
- privacy explanation copy is visible on the page

## Moderation Steps

1. As a member, open `/messages/[threadId]`
2. Report a message from another participant
3. Sign in with a moderator or admin account
4. Open `/admin/moderation`
5. Record a review note or close the report
6. For one case, choose `Escalader au niveau sévère` and provide an escalation owner

## Moderation Expected Results

- the report appears in the moderation queue
- the moderator action is recorded with owner and timestamp
- escalated cases move to `escalated` and store an escalation owner
