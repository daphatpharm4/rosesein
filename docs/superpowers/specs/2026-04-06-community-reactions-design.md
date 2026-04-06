# ROSE-SEIN — Community Reactions Design

**Date**: 6 April 2026
**Status**: Approved
**Scope**: Lightweight emoji reactions on community thread posts and replies

---

## Context

Community members currently have to write a full reply to acknowledge a post. Many patients are fatigued or emotionally overwhelmed and cannot always compose a message — but still want to signal presence and support. A single-tap reaction lowers the barrier to engagement and makes the community feel warmer and more alive.

### Key decisions

- **4 reaction types**: ❤️ Touché(e) · 🕯️ Je pense à vous · 💪 Courage · 🙏 Merci — warm, non-toxic, ROSE-SEIN-aligned
- **One reaction per user per target**: selecting a new kind replaces the previous one; tapping your active reaction removes it
- **Reactions on both threads and replies**
- **Reactors visible**: names/pseudos shown in a popover on count tap; anonymous users display as "Anonyme"
- **Two separate tables** (not polymorphic) for proper FK cascade and clean RLS

---

## Database

**Migration**: `supabase/migrations/0010_community_reactions.sql`

```sql
create type public.reaction_kind as enum ('touche', 'pense', 'courage', 'merci');

create table public.community_thread_reactions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.reaction_kind not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (thread_id, user_id)
);

create index community_thread_reactions_thread_id_idx
  on public.community_thread_reactions (thread_id);

create table public.community_reply_reactions (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references public.community_replies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.reaction_kind not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (reply_id, user_id)
);

create index community_reply_reactions_reply_id_idx
  on public.community_reply_reactions (reply_id);

-- RLS
alter table public.community_thread_reactions enable row level security;
alter table public.community_reply_reactions enable row level security;

-- Read: authenticated users
create policy "thread_reactions_select_auth"
  on public.community_thread_reactions for select using (auth.uid() is not null);

create policy "reply_reactions_select_auth"
  on public.community_reply_reactions for select using (auth.uid() is not null);

-- Insert: own row only
create policy "thread_reactions_insert_own"
  on public.community_thread_reactions for insert
  with check (auth.uid() = user_id);

create policy "reply_reactions_insert_own"
  on public.community_reply_reactions for insert
  with check (auth.uid() = user_id);

-- Update: own row only (kind change = upsert via on conflict)
create policy "thread_reactions_update_own"
  on public.community_thread_reactions for update
  using (auth.uid() = user_id);

create policy "reply_reactions_update_own"
  on public.community_reply_reactions for update
  using (auth.uid() = user_id);

-- Delete: own row only
create policy "thread_reactions_delete_own"
  on public.community_thread_reactions for delete
  using (auth.uid() = user_id);

create policy "reply_reactions_delete_own"
  on public.community_reply_reactions for delete
  using (auth.uid() = user_id);
```

---

## Data layer

**File**: `lib/communaute.ts` (extended — no new file needed)

### Types

```typescript
export type ReactionKind = 'touche' | 'pense' | 'courage' | 'merci';

export type ReactionSummary = {
  kind: ReactionKind;
  count: number;
  users: { displayName: string; isAnonymous: boolean }[];
};

export type ReactionsPayload = {
  summary: ReactionSummary[];   // all 4 kinds, count 0 if none
  myReaction: ReactionKind | null;
};
```

### Functions

- `getThreadReactions(threadId: string): Promise<ReactionsPayload>` — loads reactions for one thread, joins profiles for display names
- `getReplyReactionsMap(replyIds: string[]): Promise<Record<string, ReactionsPayload>>` — batched load for all replies on a page; keyed by reply ID
- `toggleThreadReaction(threadId: string, kind: ReactionKind): Promise<void>` — server action; upserts or deletes current user's reaction
- `toggleReplyReaction(replyId: string, kind: ReactionKind): Promise<void>` — server action; same logic for replies

**Toggle logic** (both actions):
1. Fetch current user's existing reaction for this target
2. If same kind → `DELETE` (toggle off)
3. If different kind → `UPDATE kind` (replace)
4. If none → `INSERT`

Reactions are loaded alongside existing thread/reply page queries — no extra round-trips on page load.

---

## Component

**File**: `components/community/reaction-bar.tsx`

```
❤️ Touché(e)  2   🕯️ Je pense à vous  1   💪 Courage  0   🙏 Merci  0
```

### Behaviour

- 4 buttons, always visible (zero-count reactions shown faint, never hidden)
- Active reaction (current user's) gets `bg-primary/10 text-primary` highlight
- Tapping active reaction → removes it
- Tapping inactive reaction → sets it, replacing previous
- Tapping the **count** (number) → opens inline popover listing reactor names/pseudos; anonymous users display as "Anonyme"
- Uses `useOptimistic` for instant feedback — no loading spinner

### Props

```typescript
type ReactionBarProps = {
  initialPayload: ReactionsPayload;
  onToggle: (kind: ReactionKind) => Promise<void>;  // bound server action
};
```

### Placement

| Location | Target |
|----------|--------|
| `app/(protected)/communaute/[spaceSlug]/page.tsx` | Thread summaries in space listing |
| `app/(protected)/communaute/[spaceSlug]/[threadId]/page.tsx` | Thread body + each reply |

---

## Reaction labels & emojis

| kind | Emoji | Label |
|------|-------|-------|
| `touche` | ❤️ | Touché(e) |
| `pense` | 🕯️ | Je pense à vous |
| `courage` | 💪 | Courage |
| `merci` | 🙏 | Merci |

---

## What is NOT in scope

- Reactions on messages (private chat) — separate surface
- Notification triggered by a reaction — deferred
- Staff-only reaction moderation — not needed (reactions are positive-only)
- Reaction analytics in admin panel — deferred
