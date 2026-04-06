# Admin Collective Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give staff an admin panel to send broadcast messages to member segments and create named group conversations, with a history view of past sends.

**Architecture:** One new DB table (`admin_broadcasts`) + a Postgres RPC function (`send_broadcast`) for bulk broadcast inserts. Data layer in `lib/admin-messaging.ts`. Two server actions in `app/(protected)/admin/messagerie/actions.ts`. A client-side `MemberPicker` component for the group form. The admin panel page at `/admin/messagerie`. Admin hub gains a third card.

**Tech Stack:** Next.js 15 App Router, TypeScript 5.8, Supabase PostgreSQL + RLS + RPC, Tailwind CSS 3, Lucide React. Patterns: `requireStaff` for auth, `createSupabaseServerClient` for writes, `revalidatePath` for cache busting, `"use client"` + `useState` for the MemberPicker.

---

## File map

**New files:**
- `supabase/migrations/0014_admin_collective_messaging.sql`
- `lib/admin-messaging.ts`
- `app/(protected)/admin/messagerie/actions.ts`
- `app/(protected)/admin/messagerie/page.tsx`
- `components/admin/member-picker.tsx`

**Modified files:**
- `app/(protected)/admin/page.tsx` — add third card + fix `requireCompletedProfile` → `requireStaff`

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/0014_admin_collective_messaging.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/0014_admin_collective_messaging.sql

-- 1. admin_broadcasts — tracks each broadcast event
create table if not exists public.admin_broadcasts (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null,
  body            text not null,
  segment         text not null check (segment in ('all', 'patient', 'caregiver')),
  recipient_count int not null default 0,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default timezone('utc', now())
);

create index if not exists admin_broadcasts_created_at_idx
  on public.admin_broadcasts (created_at desc);

alter table public.admin_broadcasts enable row level security;

drop policy if exists "admin_broadcasts_select_staff" on public.admin_broadcasts;
create policy "admin_broadcasts_select_staff"
  on public.admin_broadcasts for select
  using (public.has_role('admin') or public.has_role('moderator'));

drop policy if exists "admin_broadcasts_insert_staff" on public.admin_broadcasts;
create policy "admin_broadcasts_insert_staff"
  on public.admin_broadcasts for insert
  with check (public.has_role('admin') or public.has_role('moderator'));

-- 2. has_role_for_user — needed by send_broadcast to exclude staff from recipients
create or replace function public.has_role_for_user(
  p_user_id uuid,
  p_role    public.platform_role
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id
      and role = p_role
  );
$$;

-- 3. send_broadcast — bulk creates one thread+participants+message per recipient
create or replace function public.send_broadcast(
  p_subject   text,
  p_body      text,
  p_segment   text,
  p_sender_id uuid
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient  record;
  v_thread_id  uuid;
  v_count      int := 0;
begin
  if p_segment not in ('all', 'patient', 'caregiver') then
    raise exception 'Invalid segment: %', p_segment;
  end if;

  for v_recipient in
    select p.id
    from public.profiles p
    where (
      p_segment = 'all'
      or (p_segment = 'patient'   and p.profile_kind = 'patient'::public.profile_kind)
      or (p_segment = 'caregiver' and p.profile_kind = 'caregiver'::public.profile_kind)
    )
    and not public.has_role_for_user(p.id, 'admin')
    and not public.has_role_for_user(p.id, 'moderator')
  loop
    insert into public.conversation_threads (kind, title, is_official, created_by)
    values ('association', null, true, p_sender_id)
    returning id into v_thread_id;

    -- Recipient participant
    insert into public.thread_participants (thread_id, user_id)
    values (v_thread_id, v_recipient.id);

    -- Sender participant (so replies appear in staff inbox)
    insert into public.thread_participants (thread_id, user_id)
    values (v_thread_id, p_sender_id)
    on conflict (thread_id, user_id) do nothing;

    insert into public.messages (thread_id, sender_id, body)
    values (v_thread_id, p_sender_id, p_body);

    v_count := v_count + 1;
  end loop;

  insert into public.admin_broadcasts (subject, body, segment, recipient_count, created_by)
  values (p_subject, p_body, p_segment, v_count, p_sender_id);

  return v_count;
end;
$$;
```

- [ ] **Step 2: Verify the file exists**

```bash
cd /Users/charlesvictormahouve/Documents/rosesein
cat supabase/migrations/0014_admin_collective_messaging.sql | head -5
```
Expected: first 5 lines of the file printed.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0014_admin_collective_messaging.sql
git commit -m "feat(db): add admin_broadcasts table and send_broadcast RPC"
```

---

## Task 2: Data layer

**Files:**
- Create: `lib/admin-messaging.ts`

Context: `createSupabaseServerClient` from `@/lib/supabase/server` must be awaited. `conversation_threads` has columns: `id, kind, title, is_official, created_by, created_at`. `thread_participants` has `thread_id, user_id`. `profiles` has `id, display_name, pseudonym, profile_kind`.

- [ ] **Step 1: Write the file**

```typescript
// lib/admin-messaging.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BroadcastSegment = "all" | "patient" | "caregiver";

export type AdminBroadcast = {
  id: string;
  subject: string;
  body: string;
  segment: BroadcastSegment;
  recipientCount: number;
  createdAt: string;
};

export type AdminGroup = {
  id: string;
  title: string;
  participantCount: number;
  createdAt: string;
};

export type AdminMessagingHistory = {
  broadcasts: AdminBroadcast[];
  groups: AdminGroup[];
};

export type MemberOption = {
  id: string;
  displayName: string;
  pseudonym: string | null;
  profileKind: "patient" | "caregiver";
};

export async function getAdminMessagingHistory(
  staffUserId: string,
): Promise<AdminMessagingHistory> {
  const supabase = await createSupabaseServerClient();

  const [{ data: broadcastRows }, { data: groupThreadRows }] = await Promise.all([
    supabase
      .from("admin_broadcasts")
      .select("id, subject, body, segment, recipient_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("conversation_threads")
      .select("id, title, created_at")
      .eq("kind", "group")
      .eq("is_official", true)
      .eq("created_by", staffUserId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const groupIds = (groupThreadRows ?? []).map((t) => t.id as string);

  const { data: participantRows } =
    groupIds.length > 0
      ? await supabase
          .from("thread_participants")
          .select("thread_id")
          .in("thread_id", groupIds)
      : { data: [] };

  const countByThread = new Map<string, number>();
  for (const row of participantRows ?? []) {
    const tid = row.thread_id as string;
    countByThread.set(tid, (countByThread.get(tid) ?? 0) + 1);
  }

  const broadcasts: AdminBroadcast[] = (broadcastRows ?? []).map((row) => ({
    id: row.id as string,
    subject: row.subject as string,
    body: row.body as string,
    segment: row.segment as BroadcastSegment,
    recipientCount: row.recipient_count as number,
    createdAt: row.created_at as string,
  }));

  const groups: AdminGroup[] = (groupThreadRows ?? []).map((row) => ({
    id: row.id as string,
    title: (row.title as string | null) ?? "Groupe sans titre",
    participantCount: countByThread.get(row.id as string) ?? 0,
    createdAt: row.created_at as string,
  }));

  return { broadcasts, groups };
}

export async function getMemberList(): Promise<MemberOption[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, pseudonym, profile_kind")
    .order("display_name", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    displayName: row.display_name as string,
    pseudonym: row.pseudonym as string | null,
    profileKind: row.profile_kind as "patient" | "caregiver",
  }));
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/charlesvictormahouve/Documents/rosesein
npx tsc --noEmit 2>&1 | grep "admin-messaging"
```
Expected: no output. Fix any errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add lib/admin-messaging.ts
git commit -m "feat(lib): add admin-messaging data layer"
```

---

## Task 3: Server actions

**Files:**
- Create: `app/(protected)/admin/messagerie/actions.ts`

Context: `requireStaff` returns `{ user, profile, roles, configured }`. `user.id` is the authenticated staff UUID. The `send_broadcast` RPC returns an `int` (recipient count). FormData with multiple checkboxes of the same `name` is read with `formData.getAll(name)`.

- [ ] **Step 1: Create directory and write the file**

```bash
mkdir -p "/Users/charlesvictormahouve/Documents/rosesein/app/(protected)/admin/messagerie"
```

Then write `app/(protected)/admin/messagerie/actions.ts`:

```typescript
"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BroadcastSegment } from "@/lib/admin-messaging";

const VALID_SEGMENTS = new Set<string>(["all", "patient", "caregiver"]);

export async function sendBroadcast(formData: FormData): Promise<void> {
  const subject = (formData.get("subject") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const segment = (formData.get("segment") as string | null)?.trim() ?? "";

  if (!subject) redirect("/admin/messagerie?error=subject-required" as Route);
  if (body.length < 10) redirect("/admin/messagerie?error=body-too-short" as Route);
  if (!VALID_SEGMENTS.has(segment)) redirect("/admin/messagerie?error=segment-invalid" as Route);

  const { user } = await requireStaff("/admin/messagerie");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("send_broadcast", {
    p_subject: subject,
    p_body: body,
    p_segment: segment as BroadcastSegment,
    p_sender_id: user.id,
  });

  if (error) redirect("/admin/messagerie?error=broadcast-failed" as Route);

  revalidatePath("/admin/messagerie");
  redirect("/admin/messagerie" as Route);
}

export async function createGroup(formData: FormData): Promise<void> {
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const memberIds = (formData.getAll("memberIds") as string[]).filter(Boolean);

  if (!title) redirect("/admin/messagerie?error=title-required" as Route);
  if (body.length < 10) redirect("/admin/messagerie?error=body-too-short" as Route);
  if (memberIds.length === 0) redirect("/admin/messagerie?error=no-members" as Route);

  const { user } = await requireStaff("/admin/messagerie");
  const supabase = await createSupabaseServerClient();

  const { data: threadData, error: threadError } = await supabase
    .from("conversation_threads")
    .insert({ kind: "group", title, is_official: true, created_by: user.id })
    .select("id")
    .single();

  if (threadError || !threadData) redirect("/admin/messagerie?error=group-failed" as Route);

  const threadId = (threadData as { id: string }).id;

  const allParticipantIds = Array.from(new Set([...memberIds, user.id]));
  const participantRows = allParticipantIds.map((userId) => ({
    thread_id: threadId,
    user_id: userId,
  }));

  const { error: participantsError } = await supabase
    .from("thread_participants")
    .insert(participantRows);

  if (participantsError) redirect("/admin/messagerie?error=group-failed" as Route);

  const { error: messageError } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender_id: user.id, body });

  if (messageError) redirect("/admin/messagerie?error=group-failed" as Route);

  revalidatePath("/admin/messagerie");
  redirect("/admin/messagerie" as Route);
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/charlesvictormahouve/Documents/rosesein
npx tsc --noEmit 2>&1 | grep "messagerie"
```
Expected: no output. Fix any errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/admin/messagerie/actions.ts"
git commit -m "feat(actions): add sendBroadcast and createGroup server actions"
```

---

## Task 4: MemberPicker component

**Files:**
- Create: `components/admin/member-picker.tsx`

Context: This is a `"use client"` component. It uses `useState` for filter text and selected IDs. Selected IDs are submitted as hidden inputs with `name="memberIds"` so `formData.getAll("memberIds")` in the server action receives the full array. The `MemberOption` type is imported from `@/lib/admin-messaging`.

- [ ] **Step 1: Write the file**

```tsx
// components/admin/member-picker.tsx
"use client";

import { useState } from "react";

import type { MemberOption } from "@/lib/admin-messaging";

type MemberPickerProps = {
  members: MemberOption[];
};

export function MemberPicker({ members }: MemberPickerProps) {
  const [filter, setFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const q = filter.toLowerCase();
  const filtered = members.filter(
    (m) =>
      m.displayName.toLowerCase().includes(q) ||
      (m.pseudonym?.toLowerCase().includes(q) ?? false),
  );

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Rechercher un membre…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
        aria-label="Rechercher un membre"
      />

      {selectedIds.size > 0 && (
        <p className="font-label text-xs text-on-surface-variant">
          {selectedIds.size} membre{selectedIds.size > 1 ? "s" : ""} sélectionné
          {selectedIds.size > 1 ? "s" : ""}
        </p>
      )}

      {/* Hidden inputs carry selected IDs through form submission */}
      {Array.from(selectedIds).map((id) => (
        <input key={id} type="hidden" name="memberIds" value={id} />
      ))}

      <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-brand border border-outline-variant bg-surface-container-low p-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-outline">Aucun membre trouvé.</p>
        ) : (
          filtered.map((member) => {
            const visibleName = member.pseudonym ?? member.displayName;
            const badge = member.profileKind === "patient" ? "Patiente" : "Aidant·e";
            const isSelected = selectedIds.has(member.id);

            return (
              <label
                key={member.id}
                className={`flex cursor-pointer items-center gap-3 rounded px-3 py-2 transition-colors ${
                  isSelected ? "bg-primary/5" : "hover:bg-surface-container"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(member.id)}
                  className="h-4 w-4 accent-primary"
                  aria-label={`Sélectionner ${visibleName}`}
                />
                <span className="flex-1 text-sm text-on-surface">{visibleName}</span>
                <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label text-xs text-on-secondary-container">
                  {badge}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/charlesvictormahouve/Documents/rosesein
npx tsc --noEmit 2>&1 | grep "member-picker"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/admin/member-picker.tsx
git commit -m "feat(components): add MemberPicker client component"
```

---

## Task 5: Admin messagerie page

**Files:**
- Create: `app/(protected)/admin/messagerie/page.tsx`

Context: `searchParams` in Next.js 15 is `Promise<Record<string, string | undefined>>` — must be awaited. `requireStaff` returns `{ user, ... }`. Call `getAdminMessagingHistory(user.id)` and `getMemberList()` in parallel. Import `sendBroadcast` and `createGroup` from `./actions`. Import `MemberPicker` from `@/components/admin/member-picker`.

Segment badge labels: `all` → "Tous", `patient` → "Patients", `caregiver` → "Aidants".

Date formatter: `new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))`.

- [ ] **Step 1: Write the file**

```tsx
// app/(protected)/admin/messagerie/page.tsx
import Link from "next/link";
import { ArrowLeft, Send, Users } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { MemberPicker } from "@/components/admin/member-picker";
import { requireStaff } from "@/lib/auth";
import {
  getAdminMessagingHistory,
  getMemberList,
} from "@/lib/admin-messaging";
import { sendBroadcast, createGroup } from "./actions";

export const metadata: Metadata = { title: "Messagerie collective" };
export const dynamic = "force-dynamic";

const ERROR_LABELS: Record<string, string> = {
  "subject-required": "Le sujet est obligatoire.",
  "body-too-short": "Le message doit contenir au moins 10 caractères.",
  "segment-invalid": "Veuillez sélectionner un groupe de destinataires.",
  "title-required": "Le nom du groupe est obligatoire.",
  "no-members": "Sélectionnez au moins un membre.",
  "broadcast-failed": "L'envoi a échoué. Veuillez réessayer.",
  "group-failed": "La création du groupe a échoué. Veuillez réessayer.",
};

const SEGMENT_LABELS: Record<string, string> = {
  all: "Tous",
  patient: "Patients",
  caregiver: "Aidants",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function MessageriePage({ searchParams }: Props) {
  const { user } = await requireStaff("/admin/messagerie");
  const { error } = await searchParams;

  const [history, members] = await Promise.all([
    getAdminMessagingHistory(user.id),
    getMemberList(),
  ]);

  return (
    <AppShell title="Administration" currentPath="/admin">
      <section className="space-y-8">
        <Link
          href={"/admin" as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Administration
        </Link>

        <div className="space-y-2">
          <div className="eyebrow">Espace équipe</div>
          <h1 className="editorial-title">Messagerie collective</h1>
          <p className="text-base leading-7 text-on-surface-variant">
            Diffusez un message à tous vos membres ou créez des groupes de conversation.
          </p>
        </div>

        {/* Error banner */}
        {error && ERROR_LABELS[error] && (
          <div className="rounded-brand bg-primary/10 px-4 py-3 font-label text-sm font-semibold text-primary">
            {ERROR_LABELS[error]}
          </div>
        )}

        {/* History */}
        <section className="space-y-4">
          <h2 className="font-headline text-lg font-semibold text-on-surface">Historique</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Broadcasts */}
            <div className="surface-section space-y-3">
              <h3 className="font-label text-sm font-semibold uppercase tracking-[0.12em] text-outline">
                Diffusions envoyées
              </h3>
              {history.broadcasts.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Aucune diffusion envoyée.</p>
              ) : (
                <ul className="space-y-3">
                  {history.broadcasts.map((b) => (
                    <li key={b.id} className="flex flex-col gap-0.5">
                      <span className="font-label text-sm font-semibold text-on-surface">
                        {b.subject}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label text-xs text-on-secondary-container">
                          {SEGMENT_LABELS[b.segment] ?? b.segment}
                        </span>
                        {b.recipientCount} destinataire{b.recipientCount > 1 ? "s" : ""}
                        &middot; {formatDate(b.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Groups */}
            <div className="surface-section space-y-3">
              <h3 className="font-label text-sm font-semibold uppercase tracking-[0.12em] text-outline">
                Groupes créés
              </h3>
              {history.groups.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Aucun groupe créé.</p>
              ) : (
                <ul className="space-y-3">
                  {history.groups.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-label text-sm font-semibold text-on-surface">
                          {g.title}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {g.participantCount} membre{g.participantCount > 1 ? "s" : ""} &middot;{" "}
                          {formatDate(g.createdAt)}
                        </span>
                      </div>
                      <Link
                        href={`/messages/${g.id}` as Route}
                        className="shrink-0 font-label text-xs font-semibold text-primary hover:underline"
                      >
                        Ouvrir →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Broadcast form */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Envoyer une diffusion
            </h2>
            <p className="text-sm text-on-surface-variant">
              Chaque destinataire reçoit un fil privé avec l&apos;association dans sa messagerie.
            </p>
          </div>
          <form action={sendBroadcast} className="surface-section space-y-5">
            <div className="space-y-2">
              <label htmlFor="broadcast-subject" className="font-label text-sm font-semibold text-on-surface">
                Sujet
              </label>
              <input
                id="broadcast-subject"
                name="subject"
                type="text"
                required
                placeholder="ex : Réunion mensuelle de septembre"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="broadcast-body" className="font-label text-sm font-semibold text-on-surface">
                Message
              </label>
              <textarea
                id="broadcast-body"
                name="body"
                required
                minLength={10}
                rows={4}
                placeholder="Écrivez votre message ici…"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm leading-7 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="font-label text-sm font-semibold text-on-surface">
                Destinataires
              </legend>
              <div className="flex flex-wrap gap-4">
                {(["all", "patient", "caregiver"] as const).map((seg) => (
                  <label key={seg} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="segment"
                      value={seg}
                      defaultChecked={seg === "all"}
                      className="accent-primary"
                    />
                    <span className="font-body text-sm text-on-surface">
                      {seg === "all" ? "Tous les membres" : seg === "patient" ? "Patients" : "Aidants"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
              >
                <Send aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Envoyer la diffusion
              </button>
            </div>
          </form>
        </section>

        {/* Group creation form */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Créer un groupe
            </h2>
            <p className="text-sm text-on-surface-variant">
              Un groupe de conversation partagé — tous les membres peuvent lire et répondre.
            </p>
          </div>
          <form action={createGroup} className="surface-section space-y-5">
            <div className="space-y-2">
              <label htmlFor="group-title" className="font-label text-sm font-semibold text-on-surface">
                Nom du groupe
              </label>
              <input
                id="group-title"
                name="title"
                type="text"
                required
                placeholder="ex : Groupe soutien septembre 2026"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="group-body" className="font-label text-sm font-semibold text-on-surface">
                Premier message
              </label>
              <textarea
                id="group-body"
                name="body"
                required
                minLength={10}
                rows={3}
                placeholder="Bonjour à toutes et tous…"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm leading-7 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <p className="font-label text-sm font-semibold text-on-surface">
                Membres
              </p>
              <MemberPicker members={members} />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
              >
                <Users aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Créer le groupe
              </button>
            </div>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/charlesvictormahouve/Documents/rosesein
npx tsc --noEmit 2>&1 | grep "messagerie"
```
Expected: no output. Fix any errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/admin/messagerie/page.tsx"
git commit -m "feat(admin): add messagerie collective page"
```

---

## Task 6: Admin hub update

**Files:**
- Modify: `app/(protected)/admin/page.tsx`

Two changes:
1. Add a third card linking to `/admin/messagerie` with a `Send` icon
2. Fix `requireCompletedProfile` → `requireStaff` (security fix — any authenticated user with a profile was reaching the admin hub)

Read the current file first before editing.

- [ ] **Step 1: Read current file**

```bash
cat "/Users/charlesvictormahouve/Documents/rosesein/app/(protected)/admin/page.tsx"
```

- [ ] **Step 2: Replace the file**

```tsx
// app/(protected)/admin/page.tsx
import Link from "next/link";
import { Megaphone, Send, ShieldAlert } from "lucide-react";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { requireStaff } from "@/lib/auth";

export default async function AdminPage() {
  await requireStaff("/admin");

  return (
    <AppShell title="Administration" currentPath="/admin">
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="eyebrow">Espace équipe</div>
          <h1 className="editorial-title">Administration</h1>
          <p className="text-base leading-7 text-on-surface-variant">
            Outils de gestion réservés aux membres de l&apos;équipe ROSE-SEIN.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={"/admin/moderation" as Route}
            className="surface-card group flex items-start gap-4 hover:border-primary/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldAlert aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                Modération
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Signalements, avertissements et actions de modération.
              </p>
            </div>
          </Link>

          <Link
            href={"/admin/message-association" as Route}
            className="surface-card group flex items-start gap-4 hover:border-primary/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Megaphone aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                Message de l&apos;association
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Publiez un message visible sur la page d&apos;accueil.
              </p>
            </div>
          </Link>

          <Link
            href={"/admin/messagerie" as Route}
            className="surface-card group flex items-start gap-4 hover:border-primary/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Send aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                Messagerie collective
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Diffusions ciblées et groupes de conversation.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/charlesvictormahouve/Documents/rosesein
npx tsc --noEmit 2>&1 | grep "admin/page"
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add "app/(protected)/admin/page.tsx"
git commit -m "feat(admin): add messagerie collective hub card and fix requireStaff"
```

---

## Verification

1. Run `npx tsc --noEmit` — confirm same 11 pre-existing errors, zero new ones
2. `npm run dev` → navigate to `/admin` — three cards visible
3. Click "Messagerie collective" → `/admin/messagerie` page loads
4. Submit broadcast form (fill subject + body + select segment) → redirects back, broadcast appears in history
5. Submit group form (fill title + body + select ≥ 1 member) → redirects back, group appears in history with "Ouvrir →" link
6. Click "Ouvrir →" on a group → navigates to `/messages/[threadId]` and shows the conversation
7. As a non-staff authenticated user, navigate to `/admin/messagerie` → `notFound()` (404)
