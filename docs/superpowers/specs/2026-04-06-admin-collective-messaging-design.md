# ROSE-SEIN — Admin Collective Messaging Design

**Date**: 6 April 2026
**Status**: Approved
**Scope**: Staff can send broadcasts to member segments and create named group conversations, with admin history panel

---

## Context

Staff currently have no in-app way to reach multiple members at once. They must either use external email or create threads one by one. Collective messaging gives the association team two tools: a broadcast (one message → N private threads, one per recipient) and a group conversation (one shared thread with selected members). Both surfaces appear in recipients' standard messaging inbox.

### Key decisions

- **Broadcast = N private threads**: each recipient gets their own "Association ROSE-SEIN" thread — no one sees who else received the message. The staff sender is added as a participant so replies land in their inbox.
- **Group = one shared thread**: full two-way, all members can reply and see each other
- **Three broadcast segments**: all members / patients only / caregivers only
- **DB function for bulk broadcast**: a single RPC call creates all threads, participants, and messages server-side — avoids N round-trips
- **Admin history**: the admin panel shows past broadcasts and staff-created groups with counts and dates
- **Approach**: reuse existing `conversation_threads` / `thread_participants` / `messages` schema; one new table (`admin_broadcasts`). `conversation_threads.created_by` already exists in migration 0001 — no schema change needed.

---

## Database

**Migration**: `supabase/migrations/0013_admin_collective_messaging.sql`

### 1. New `admin_broadcasts` table

```sql
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
```

### 2. Helper function `has_role_for_user`

Needed by `send_broadcast` to exclude staff from recipient list. Uses `public.platform_role` enum to match the existing `user_roles` schema.

```sql
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
```

### 3. DB function `send_broadcast`

Creates one thread + two participants (recipient + sender) + one message per matching user, then records the broadcast event.

```sql
create or replace function public.send_broadcast(
  p_subject   text,
  p_body      text,
  p_segment   text,     -- 'all' | 'patient' | 'caregiver'
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

    -- Recipient as participant
    insert into public.thread_participants (thread_id, user_id)
    values (v_thread_id, v_recipient.id);

    -- Sender as participant (so replies appear in staff inbox)
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

---

## Data layer

**File**: `lib/admin-messaging.ts` (new)

### Types

```typescript
export type BroadcastSegment = 'all' | 'patient' | 'caregiver';

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
  profileKind: 'patient' | 'caregiver';
};
```

### Functions

**`getAdminMessagingHistory(staffUserId: string): Promise<AdminMessagingHistory>`**
- Uses `createSupabaseServerClient`
- Queries `admin_broadcasts` ordered by `created_at desc`, limit 50
- Queries `conversation_threads` where `kind = 'group'` AND `is_official = true` AND `created_by = staffUserId`, ordered by `created_at desc`, limit 50
- For each group thread: joins `thread_participants` count via a subquery (or fetches participant counts separately)

**`getMemberList(): Promise<MemberOption[]>`**
- Uses `createSupabaseServerClient`
- Queries `profiles` for all rows, selects `id, display_name, pseudonym, profile_kind`
- Returns sorted by `display_name asc`
- Used to populate the group member picker (client-side filtering)

---

## Server actions

**File**: `app/(protected)/admin/messagerie/actions.ts`

### `sendBroadcast(formData: FormData): Promise<void>`

1. Extract: `subject` (trim), `body` (trim), `segment`
2. Validate:
   - `subject` non-empty → `?error=subject-required`
   - `body.length >= 10` → `?error=body-too-short`
   - `segment` in `['all', 'patient', 'caregiver']` → `?error=segment-invalid`
3. `const { user } = await requireStaff("/admin/messagerie")`
4. `const supabase = await createSupabaseServerClient()`
5. `const { error } = await supabase.rpc('send_broadcast', { p_subject: subject, p_body: body, p_segment: segment, p_sender_id: user.id })`
6. On error → `redirect("/admin/messagerie?error=broadcast-failed" as Route)`
7. `revalidatePath("/admin/messagerie")` → `redirect("/admin/messagerie" as Route)`

### `createGroup(formData: FormData): Promise<void>`

1. Extract: `title` (trim), `body` (trim — opening message), `memberIds` (all values for key `"memberIds"` from FormData)
2. Validate:
   - `title` non-empty → `?error=title-required`
   - `body.length >= 10` → `?error=body-too-short`
   - `memberIds.length >= 1` → `?error=no-members`
3. `const { user } = await requireStaff("/admin/messagerie")`
4. `const supabase = await createSupabaseServerClient()`
5. Insert into `conversation_threads`: `{ kind: 'group', title, is_official: true, created_by: user.id }` → get `threadId`
6. Insert into `thread_participants`: one row per `[...memberIds, user.id]` (staff is a participant)
7. Insert into `messages`: `{ thread_id: threadId, sender_id: user.id, body }`
8. On any Supabase error → `redirect("/admin/messagerie?error=group-failed" as Route)`
9. `revalidatePath("/admin/messagerie")` → `redirect("/admin/messagerie" as Route)`

---

## Admin panel UI

**New file**: `app/(protected)/admin/messagerie/page.tsx`

`export const dynamic = "force-dynamic"`

### Page layout

```
[Back to Administration]

eyebrow: Espace équipe
h1: Messagerie collective
subtitle: Diffusez un message à tous vos membres ou créez des groupes de conversation.

─── Historique ─────────────────────────────────────────────────
  [Diffusions envoyées]
  each row: subject · segment badge (Tous/Patients/Aidants) · N destinataires · date
  empty state: "Aucune diffusion envoyée."

  [Groupes créés]
  each row: title · N membres · date · link → /messages/[id]
  empty state: "Aucun groupe créé."

─── Envoyer une diffusion ──────────────────────────────────────
  surface-section card
  Sujet          [text input, required]
  Message        [textarea, required, minLength=10]
  Destinataires  ○ Tous les membres  ○ Patients  ○ Aidants
                                         [Envoyer la diffusion →]

─── Créer un groupe ────────────────────────────────────────────
  surface-section card
  Nom du groupe        [text input, required]
  Premier message      [textarea, required, minLength=10]
  Membres              [MemberPicker component]
                                         [Créer le groupe →]
```

### Error states

Error query param `error` mapped to French labels:
- `subject-required` → "Le sujet est obligatoire."
- `body-too-short` → "Le message doit contenir au moins 10 caractères."
- `segment-invalid` → "Veuillez sélectionner un groupe de destinataires."
- `title-required` → "Le nom du groupe est obligatoire."
- `no-members` → "Sélectionnez au moins un membre."
- `broadcast-failed` → "L'envoi a échoué. Veuillez réessayer."
- `group-failed` → "La création du groupe a échoué. Veuillez réessayer."

### Segment badge labels

| segment | label |
|---------|-------|
| `all` | Tous |
| `patient` | Patients |
| `caregiver` | Aidants |

---

## MemberPicker component

**File**: `components/admin/member-picker.tsx` (`"use client"`)

```typescript
type MemberPickerProps = {
  members: MemberOption[];  // full list, loaded server-side
};
```

- Single text `<input>` filters the list by `displayName` or `pseudonym` (client-side, no network)
- Filtered list of checkboxes: each shows visible name + profile kind badge ("Patiente" / "Aidant·e")
- Each checked member renders a `<input type="hidden" name="memberIds" value={id} />` so FormData picks up the full selected list on submit
- Selected count shown: "N membre(s) sélectionné(s)"

---

## Admin hub update

**Modified file**: `app/(protected)/admin/page.tsx`

Add a third card to the existing two-card grid (`sm:grid-cols-2` → `sm:grid-cols-2 lg:grid-cols-3` or keep 2-col with third wrapping):

```tsx
<Link href={"/admin/messagerie" as Route} className="surface-card group flex items-start gap-4">
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
```

---

## What is NOT in scope

- Staff monitoring individual broadcast reply threads from admin panel (replies visible via normal `/messages` inbox)
- Editing or deleting sent broadcasts or groups
- Scheduling future-dated broadcasts
- Member search via API (picker loads all members client-side — suitable for association scale)
- Read receipts or open tracking
- Filtering broadcast history by date or segment
