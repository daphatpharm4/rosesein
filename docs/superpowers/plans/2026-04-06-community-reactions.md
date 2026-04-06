# Community Reactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-reaction-per-user emoji reactions (❤️ 🕯️ 💪 🙏) to community thread posts and replies, with optimistic UI and a reactor-name popover.

**Architecture:** Two new DB tables (`community_thread_reactions`, `community_reply_reactions`) with cascade-delete FKs and RLS. Query helpers and server actions extend the existing patterns in `lib/communaute.ts` and a new `app/(protected)/communaute/actions.ts`. A single `ReactionBar` client component uses `useOptimistic` for instant feedback and `<details>` for the reactor-name popover. The thread list card is refactored from a full-`<Link>` to a `<div>` so reaction buttons don't trigger navigation.

**Tech Stack:** Next.js 15 App Router, TypeScript 5.8, Supabase PostgreSQL + RLS, React 19 `useOptimistic` + `useTransition`, Tailwind CSS 3, Lucide React. Patterns: `createSupabaseServerClient` (awaited), `requireCompletedProfile` for auth-gated server actions, `revalidatePath` for cache invalidation.

---

## File map

**New files:**
- `supabase/migrations/0010_community_reactions.sql`
- `app/(protected)/communaute/actions.ts` — `toggleThreadReaction`, `toggleReplyReaction` server actions
- `components/community/reaction-bar.tsx` — `ReactionBar` client component

**Modified files:**
- `lib/communaute.ts` — add `ReactionKind`, `ReactionSummary`, `ReactionsPayload`, `REACTION_META`, `REACTION_KINDS`, `getThreadReactionsMap`, `getReplyReactionsMap`
- `app/(protected)/communaute/[spaceSlug]/page.tsx` — refactor thread cards, load + render reactions
- `app/(protected)/communaute/[spaceSlug]/[threadId]/page.tsx` — load + render reactions on thread + replies

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/0010_community_reactions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0010_community_reactions.sql

do $$ begin
  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace and typname = 'reaction_kind'
  ) then
    create type public.reaction_kind as enum ('touche', 'pense', 'courage', 'merci');
  end if;
end $$;

create table if not exists public.community_thread_reactions (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.community_threads(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       public.reaction_kind not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (thread_id, user_id)
);

create index if not exists community_thread_reactions_thread_id_idx
  on public.community_thread_reactions (thread_id);

create table if not exists public.community_reply_reactions (
  id         uuid primary key default gen_random_uuid(),
  reply_id   uuid not null references public.community_replies(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       public.reaction_kind not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (reply_id, user_id)
);

create index if not exists community_reply_reactions_reply_id_idx
  on public.community_reply_reactions (reply_id);

-- RLS
alter table public.community_thread_reactions enable row level security;
alter table public.community_reply_reactions enable row level security;

drop policy if exists "thread_reactions_select_auth" on public.community_thread_reactions;
create policy "thread_reactions_select_auth"
  on public.community_thread_reactions for select using (auth.uid() is not null);

drop policy if exists "thread_reactions_insert_own" on public.community_thread_reactions;
create policy "thread_reactions_insert_own"
  on public.community_thread_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "thread_reactions_update_own" on public.community_thread_reactions;
create policy "thread_reactions_update_own"
  on public.community_thread_reactions for update
  using (auth.uid() = user_id);

drop policy if exists "thread_reactions_delete_own" on public.community_thread_reactions;
create policy "thread_reactions_delete_own"
  on public.community_thread_reactions for delete
  using (auth.uid() = user_id);

drop policy if exists "reply_reactions_select_auth" on public.community_reply_reactions;
create policy "reply_reactions_select_auth"
  on public.community_reply_reactions for select using (auth.uid() is not null);

drop policy if exists "reply_reactions_insert_own" on public.community_reply_reactions;
create policy "reply_reactions_insert_own"
  on public.community_reply_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "reply_reactions_update_own" on public.community_reply_reactions;
create policy "reply_reactions_update_own"
  on public.community_reply_reactions for update
  using (auth.uid() = user_id);

drop policy if exists "reply_reactions_delete_own" on public.community_reply_reactions;
create policy "reply_reactions_delete_own"
  on public.community_reply_reactions for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Apply to local Supabase**

```bash
npx supabase db push --local
```
Expected: migration applies with no errors. Two new tables visible in Supabase Studio.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0010_community_reactions.sql
git commit -m "feat(db): add community_thread_reactions and community_reply_reactions tables"
```

---

## Task 2: Data layer — types + query functions

**Files:**
- Modify: `lib/communaute.ts`

- [ ] **Step 1: Add types, constants, and query functions**

Append the following to the end of `lib/communaute.ts`:

```typescript
// ─── Reactions ────────────────────────────────────────────────────────────────

export type ReactionKind = "touche" | "pense" | "courage" | "merci";

export type ReactionSummary = {
  kind: ReactionKind;
  count: number;
  users: { displayName: string; isAnonymous: boolean }[];
};

export type ReactionsPayload = {
  summary: ReactionSummary[];   // always all 4 kinds; count 0 if none
  myReaction: ReactionKind | null;
};

export const REACTION_KINDS: ReactionKind[] = ["touche", "pense", "courage", "merci"];

export const REACTION_META: Record<ReactionKind, { emoji: string; label: string }> = {
  touche:  { emoji: "❤️",  label: "Touché(e)" },
  pense:   { emoji: "🕯️", label: "Je pense à vous" },
  courage: { emoji: "💪",  label: "Courage" },
  merci:   { emoji: "🙏",  label: "Merci" },
};

function makeEmptyPayload(): ReactionsPayload {
  return {
    summary: REACTION_KINDS.map((kind) => ({ kind, count: 0, users: [] })),
    myReaction: null,
  };
}

type ReactionRow = {
  kind: string;
  user_id: string;
  profiles: {
    display_name: string;
    pseudonym: string | null;
    is_anonymous: boolean;
  } | null;
};

function aggregateReactions(
  rows: ReactionRow[],
  currentUserId: string | null
): ReactionsPayload {
  const summaryMap: Record<ReactionKind, ReactionSummary> = Object.fromEntries(
    REACTION_KINDS.map((kind) => [kind, { kind, count: 0, users: [] }])
  ) as Record<ReactionKind, ReactionSummary>;

  let myReaction: ReactionKind | null = null;

  for (const row of rows) {
    const kind = row.kind as ReactionKind;
    summaryMap[kind].count++;
    const p = row.profiles;
    const displayName = p?.is_anonymous
      ? (p.pseudonym ?? "Anonyme")
      : (p?.display_name ?? "Membre");
    summaryMap[kind].users.push({
      displayName,
      isAnonymous: p?.is_anonymous ?? false,
    });
    if (currentUserId && row.user_id === currentUserId) myReaction = kind;
  }

  return { summary: Object.values(summaryMap), myReaction };
}

export async function getThreadReactionsMap(
  threadIds: string[]
): Promise<Record<string, ReactionsPayload>> {
  const empty = Object.fromEntries(threadIds.map((id) => [id, makeEmptyPayload()]));
  if (!hasSupabaseBrowserEnv() || threadIds.length === 0) return empty;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("community_thread_reactions")
    .select("thread_id, kind, user_id, profiles(display_name, pseudonym, is_anonymous)")
    .in("thread_id", threadIds);

  if (!data) return empty;

  const result: Record<string, ReactionsPayload> = Object.fromEntries(
    threadIds.map((id) => [id, makeEmptyPayload()])
  );

  const byThread = (
    data as Array<ReactionRow & { thread_id: string }>
  ).reduce<Record<string, ReactionRow[]>>((acc, row) => {
    const tid = (row as unknown as { thread_id: string }).thread_id;
    (acc[tid] ??= []).push(row);
    return acc;
  }, {});

  for (const [tid, rows] of Object.entries(byThread)) {
    if (tid in result) result[tid] = aggregateReactions(rows, user?.id ?? null);
  }

  return result;
}

export async function getReplyReactionsMap(
  replyIds: string[]
): Promise<Record<string, ReactionsPayload>> {
  const empty = Object.fromEntries(replyIds.map((id) => [id, makeEmptyPayload()]));
  if (!hasSupabaseBrowserEnv() || replyIds.length === 0) return empty;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("community_reply_reactions")
    .select("reply_id, kind, user_id, profiles(display_name, pseudonym, is_anonymous)")
    .in("reply_id", replyIds);

  if (!data) return empty;

  const result: Record<string, ReactionsPayload> = Object.fromEntries(
    replyIds.map((id) => [id, makeEmptyPayload()])
  );

  const byReply = (
    data as Array<ReactionRow & { reply_id: string }>
  ).reduce<Record<string, ReactionRow[]>>((acc, row) => {
    const rid = (row as unknown as { reply_id: string }).reply_id;
    (acc[rid] ??= []).push(row);
    return acc;
  }, {});

  for (const [rid, rows] of Object.entries(byReply)) {
    if (rid in result) result[rid] = aggregateReactions(rows, user?.id ?? null);
  }

  return result;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "lib/communaute"
```
Expected: no output (no errors in that file).

- [ ] **Step 3: Commit**

```bash
git add lib/communaute.ts
git commit -m "feat(lib): add reaction types and query helpers to communaute data layer"
```

---

## Task 3: Server actions — toggle reactions

**Files:**
- Create: `app/(protected)/communaute/actions.ts`

- [ ] **Step 1: Write the actions file**

```typescript
"use server";

import { revalidatePath } from "next/cache";

import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReactionKind } from "@/lib/communaute";

export async function toggleThreadReaction(
  threadId: string,
  kind: ReactionKind
): Promise<void> {
  const { user } = await requireCompletedProfile("/communaute");
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("community_thread_reactions")
    .select("kind")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.kind === kind) {
      await supabase
        .from("community_thread_reactions")
        .delete()
        .eq("thread_id", threadId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("community_thread_reactions")
        .update({ kind })
        .eq("thread_id", threadId)
        .eq("user_id", user.id);
    }
  } else {
    await supabase
      .from("community_thread_reactions")
      .insert({ thread_id: threadId, user_id: user.id, kind });
  }

  revalidatePath("/communaute", "layout");
}

export async function toggleReplyReaction(
  replyId: string,
  kind: ReactionKind
): Promise<void> {
  const { user } = await requireCompletedProfile("/communaute");
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("community_reply_reactions")
    .select("kind")
    .eq("reply_id", replyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.kind === kind) {
      await supabase
        .from("community_reply_reactions")
        .delete()
        .eq("reply_id", replyId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("community_reply_reactions")
        .update({ kind })
        .eq("reply_id", replyId)
        .eq("user_id", user.id);
    }
  } else {
    await supabase
      .from("community_reply_reactions")
      .insert({ reply_id: replyId, user_id: user.id, kind });
  }

  revalidatePath("/communaute", "layout");
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "communaute/actions"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/(protected)/communaute/actions.ts
git commit -m "feat(actions): add toggleThreadReaction and toggleReplyReaction server actions"
```

---

## Task 4: ReactionBar component

**Files:**
- Create: `components/community/reaction-bar.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useOptimistic, useTransition } from "react";

import type { ReactionsPayload, ReactionKind } from "@/lib/communaute";
import { REACTION_KINDS, REACTION_META } from "@/lib/communaute";

type Props = {
  initialPayload: ReactionsPayload;
  onToggle: (kind: ReactionKind) => Promise<void>;
};

export function ReactionBar({ initialPayload, onToggle }: Props) {
  const [, startTransition] = useTransition();

  const [payload, applyOptimistic] = useOptimistic(
    initialPayload,
    (current: ReactionsPayload, tapped: ReactionKind): ReactionsPayload => {
      const removing = current.myReaction === tapped;
      return {
        myReaction: removing ? null : tapped,
        summary: current.summary.map((s) => {
          if (s.kind === tapped) {
            return { ...s, count: removing ? s.count - 1 : s.count + 1 };
          }
          // if replacing a previous reaction, decrement the old one
          if (!removing && s.kind === current.myReaction) {
            return { ...s, count: s.count - 1 };
          }
          return s;
        }),
      };
    }
  );

  function handleToggle(kind: ReactionKind) {
    startTransition(async () => {
      applyOptimistic(kind);
      await onToggle(kind);
    });
  }

  return (
    <div className="flex flex-wrap gap-2 pt-3">
      {REACTION_KINDS.map((kind) => {
        const { emoji, label } = REACTION_META[kind];
        const s = payload.summary.find((x) => x.kind === kind)!;
        const isActive = payload.myReaction === kind;

        return (
          <div key={kind} className="flex items-center gap-0.5">
            {/* Reaction toggle button */}
            <button
              type="button"
              onClick={() => handleToggle(kind)}
              aria-label={`Réagir : ${label}`}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : s.count > 0
                    ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    : "bg-surface-container-low text-outline hover:bg-surface-container"
              }`}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{label}</span>
            </button>

            {/* Count + popover */}
            {s.count > 0 && (
              <details className="relative">
                <summary
                  className="list-none cursor-pointer rounded-full px-2 py-1.5 font-label text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                  aria-label={`${s.count} réaction${s.count > 1 ? "s" : ""} — voir qui a réagi`}
                >
                  {s.count}
                </summary>
                <div className="glass-panel absolute bottom-9 left-0 z-50 min-w-[10rem] rounded-brand-md p-3 shadow-ambient">
                  <ul className="space-y-1">
                    {s.users.map((u, i) => (
                      <li key={i} className="font-label text-xs text-on-surface-variant">
                        {u.isAnonymous ? "Anonyme" : u.displayName}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "reaction-bar"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/community/reaction-bar.tsx
git commit -m "feat(ui): add ReactionBar client component with optimistic updates"
```

---

## Task 5: Wire reactions into thread list page

**Files:**
- Modify: `app/(protected)/communaute/[spaceSlug]/page.tsx`

The current page wraps each thread card in a `<Link>`. Reaction buttons inside a `<Link>` would trigger navigation on click. This task refactors the card to a `<div>` with an explicit navigation link, then adds the ReactionBar.

- [ ] **Step 1: Replace the file content**

Read the current file first, then replace with:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle, Pin } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { getSpaceWithThreads, getThreadReactionsMap } from "@/lib/communaute";
import { ReactionBar } from "@/components/community/reaction-bar";
import { toggleThreadReaction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ spaceSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { spaceSlug } = await params;
  const result = await getSpaceWithThreads(spaceSlug);
  if (!result) return { title: "Espace introuvable" };
  return { title: result.space.title };
}

export default async function SpacePage({ params }: Props) {
  const { spaceSlug } = await params;
  const result = await getSpaceWithThreads(spaceSlug);

  if (!result) notFound();

  const { space, threads } = result;

  const threadIds = threads.map((t) => t.id);
  const reactionsMap = await getThreadReactionsMap(threadIds);

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <Link
          href={"/communaute" as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Tous les espaces
        </Link>

        <div className="space-y-2">
          <div className="eyebrow">Espace communauté</div>
          <h1 className="editorial-title">{space.title}</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            {space.description}
          </p>
        </div>

        {threads.length > 0 ? (
          <div className="space-y-4">
            {threads.map((thread) => {
              const toggle = toggleThreadReaction.bind(null, thread.id);
              return (
                <article key={thread.id} className="surface-card space-y-3">
                  <Link
                    href={`/communaute/${spaceSlug}/${thread.id}` as Route}
                    className="group flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {thread.pinned && (
                          <Pin
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 text-primary"
                            strokeWidth={2}
                          />
                        )}
                        <h2 className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                          {thread.title}
                        </h2>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-on-surface-variant">
                        {thread.body}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="flex items-center gap-1 font-label text-xs text-outline">
                          <MessageCircle
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                            strokeWidth={1.8}
                          />
                          {thread.replyCount} réponse
                          {thread.replyCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-outline transition-colors group-hover:text-primary"
                      strokeWidth={1.8}
                    />
                  </Link>

                  <ReactionBar
                    initialPayload={reactionsMap[thread.id]}
                    onToggle={toggle}
                  />
                </article>
              );
            })}
          </div>
        ) : (
          <div className="surface-section text-center">
            <p className="text-base text-on-surface-variant">
              Aucun fil de discussion pour le moment.
            </p>
            <p className="mt-2 text-sm text-outline">
              L&apos;équipe publiera bientôt des sujets de conversation dans cet espace.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "spaceSlug"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/communaute/[spaceSlug]/page.tsx"
git commit -m "feat(community): add reaction bar to thread list cards"
```

---

## Task 6: Wire reactions into thread detail page

**Files:**
- Modify: `app/(protected)/communaute/[spaceSlug]/[threadId]/page.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { getThreadWithReplies, getThreadReactionsMap, getReplyReactionsMap } from "@/lib/communaute";
import { ReactionBar } from "@/components/community/reaction-bar";
import { postReply } from "./actions";
import { toggleThreadReaction, toggleReplyReaction } from "../../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ spaceSlug: string; threadId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { threadId } = await params;
  const result = await getThreadWithReplies(threadId);
  if (!result) return { title: "Fil introuvable" };
  return { title: result.thread.title };
}

function formatRelativeDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ThreadPage({ params }: Props) {
  const { spaceSlug, threadId } = await params;
  const result = await getThreadWithReplies(threadId);

  if (!result) notFound();

  const { thread, replies } = result;

  const replyIds = replies.map((r) => r.id);
  const [threadReactionsMap, replyReactionsMap] = await Promise.all([
    getThreadReactionsMap([threadId]),
    getReplyReactionsMap(replyIds),
  ]);

  const threadToggle = toggleThreadReaction.bind(null, threadId);

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <Link
          href={`/communaute/${spaceSlug}` as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour à {thread.spaceTitle}
        </Link>

        {/* Thread body */}
        <div className="surface-section space-y-3">
          <div className="eyebrow">{thread.spaceTitle}</div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">{thread.title}</h1>
          <p className="text-base leading-8 text-on-surface-variant">{thread.body}</p>
          <ReactionBar
            initialPayload={threadReactionsMap[threadId]}
            onToggle={threadToggle}
          />
        </div>

        {/* Replies */}
        <section className="space-y-4">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            {replies.length} réponse{replies.length !== 1 ? "s" : ""}
          </h2>

          {replies.map((reply) => {
            const replyToggle = toggleReplyReaction.bind(null, reply.id);
            return (
              <article key={reply.id} className="surface-card space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-label text-sm font-semibold text-on-surface">
                    {reply.authorDisplayName}
                  </p>
                  <time className="font-label text-xs text-outline">
                    {formatRelativeDate(reply.createdAt)}
                  </time>
                </div>
                <p className="text-sm leading-7 text-on-surface-variant">{reply.body}</p>
                <ReactionBar
                  initialPayload={replyReactionsMap[reply.id]}
                  onToggle={replyToggle}
                />
              </article>
            );
          })}

          {/* Reply form */}
          <section className="surface-section space-y-4">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Ajouter une réponse
            </h2>
            <form action={postReply} className="space-y-4">
              <input type="hidden" name="threadId" value={threadId} />
              <input type="hidden" name="spaceSlug" value={spaceSlug} />
              <textarea
                name="body"
                required
                minLength={2}
                rows={4}
                placeholder="Partagez votre pensée avec bienveillance…"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm leading-7 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 font-label text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                  />
                  Répondre anonymement
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-primary px-5 py-2.5 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </section>
        </section>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 2: Full typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: same 11 pre-existing errors in `parcours/actions.ts`, `parametres/actions.ts`, etc. — zero new errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/communaute/[spaceSlug]/[threadId]/page.tsx"
git commit -m "feat(community): add reaction bar to thread detail and replies"
```

---

## Verification

1. Run `npm run dev`, navigate to `/communaute`
2. Open any space — each thread card should show 4 reaction buttons below the title/body
3. Tap ❤️ — button gets `bg-primary/10` highlight instantly (optimistic); count increments
4. Tap ❤️ again — reaction removed instantly
5. Tap 💪 while ❤️ is active — ❤️ decrements, 💪 activates
6. Tap the count number — popover opens showing reactor names
7. Open thread detail — ReactionBar appears below thread body AND below each reply
8. Reload the page — reactions persist (server state matches optimistic)
