# ROSE-SEIN — Message de l'association Design

**Date**: 6 April 2026
**Status**: Approved
**Scope**: Staff-authored announcement block on Accueil + admin panel to manage it

---

## Context

The Accueil home screen currently shows the latest article and the next upcoming event, but no direct voice from the association team. Patients opening the app in vulnerable moments benefit from knowing the association is present and active. A "Message de l'association" block gives staff a direct channel to surface announcements, closures, solidarity messages, or event reminders — distinct from editorial articles.

### Key decisions

- **One active message at a time**: the most recent row with `expires_at > now()` is shown. Publishing a new message naturally supersedes the old one.
- **Expiry-based lifecycle**: messages disappear automatically when `expires_at` passes. No manual delete needed.
- **Staff creates from within the app**: admin panel page at `/admin/message-association`. No Supabase Studio access required.
- **Dedicated table**: keeps association messages separate from articles (different concept, different audience intent).

---

## Database

**Migration**: `supabase/migrations/0012_association_messages.sql`

```sql
create table public.association_messages (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index association_messages_expires_at_idx
  on public.association_messages (expires_at desc);

alter table public.association_messages enable row level security;

-- Public read for active (non-expired) messages
create policy "assoc_messages_select"
  on public.association_messages for select
  using (expires_at > timezone('utc', now()));

-- Admin and moderator can publish
create policy "assoc_messages_insert_staff"
  on public.association_messages for insert
  with check (public.has_role('admin') or public.has_role('moderator'));
```

**Active message query**: most recent row where `expires_at > now()`, ordered by `created_at desc`, limit 1.

---

## Data layer

**File**: `lib/association-message.ts`

```typescript
export type AssociationMessage = {
  id: string;
  title: string;
  body: string;
  expiresAt: string;
  createdAt: string;
};

export async function getActiveAssociationMessage(): Promise<AssociationMessage | null>
```

- Uses `createSupabasePublicClient` (messages are public, like articles and events)
- Falls back to `null` if Supabase is not configured or no active message exists

---

## Admin panel

**Files**:
- `app/(protected)/admin/message-association/page.tsx`
- `app/(protected)/admin/message-association/actions.ts`

### Page layout

1. **Current active message** (if any):
   - Title, body, expiry date
   - Soft countdown: "Expire dans N jours" (or "Expire aujourd'hui" / "Expiré")
2. **Empty state** if no active message: "Aucun message actif en ce moment."
3. **Publish form** below:
   - `title` — text input, required
   - `body` — textarea, required, min 10 chars
   - `expires_at` — date input, required, min = tomorrow
   - Submit button: "Publier le message"

### Server action `publishAssociationMessage(formData)`

- Validates title (non-empty), body (≥ 10 chars), expires_at (future date)
- Inserts into `association_messages`
- Revalidates `/` (Accueil) and `/admin/message-association`
- Redirects back to `/admin/message-association`

### Admin nav

Add a link "Message de l'association" to the existing admin dashboard (`app/(protected)/admin/page.tsx`).

---

## Accueil display

**File**: `app/page.tsx`

- Call `getActiveAssociationMessage()` alongside existing `getPublicContentSnapshot()` and `getCurrentUserContext()`
- If message exists: render block between greeting and main hero (visible to all visitors)
- If no active message: block is absent (no empty state on Accueil)

### Visual design

```
surface-section with left border accent (border-l-4 border-primary/30)

💌 MESSAGE DE L'ASSOCIATION   ← eyebrow label
[Title — font-headline bold]
[Body — text-on-surface-variant leading-7]
Jusqu'au {formatted expiry date}   ← font-label text-xs text-outline
```

---

## What is NOT in scope

- Per-user targeting of messages (same message shown to all visitors)
- Editing or deleting existing messages (replace by publishing a new one)
- Push/email delivery of the message (in-app only)
- Rich text / image in message body (plain text only)
- Message history view for members (admin only implicitly via Supabase)
