# Association Message Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a staff-authored "Message de l'association" block to the Accueil home page, managed from a new admin panel page, with expiry-based lifecycle.

**Architecture:** New `association_messages` DB table (public read, staff insert, expiry-based RLS). Thin data layer in `lib/association-message.ts` using `createSupabasePublicClient`. Admin panel page at `/admin/message-association` with a server action to publish. Accueil renders the active message between the greeting and main hero. The `/admin` index becomes a proper hub with links to moderation and message-association.

**Tech Stack:** Next.js 15 App Router, TypeScript 5.8, Supabase PostgreSQL + RLS, Tailwind CSS 3, Lucide React. Patterns: `createSupabasePublicClient` for public reads, `requireCompletedProfile` + `createSupabaseServerClient` for staff writes, `revalidatePath` for cache invalidation.

---

## File map

**New files:**
- `supabase/migrations/0012_association_messages.sql`
- `lib/association-message.ts`
- `app/(protected)/admin/message-association/page.tsx`
- `app/(protected)/admin/message-association/actions.ts`

**Modified files:**
- `app/(protected)/admin/page.tsx` — replace redirect with hub page
- `app/page.tsx` — fetch + render association message block

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/0012_association_messages.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0012_association_messages.sql

create table if not exists public.association_messages (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists association_messages_expires_at_idx
  on public.association_messages (expires_at desc);

alter table public.association_messages enable row level security;

drop policy if exists "assoc_messages_select" on public.association_messages;
create policy "assoc_messages_select"
  on public.association_messages for select
  using (expires_at > timezone('utc', now()));

drop policy if exists "assoc_messages_insert_staff" on public.association_messages;
create policy "assoc_messages_insert_staff"
  on public.association_messages for insert
  with check (public.has_role('admin') or public.has_role('moderator'));
```

- [ ] **Step 2: Verify the file**

```bash
cat supabase/migrations/0012_association_messages.sql
```
Expected: file contents printed, table + index + 2 RLS policies visible.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0012_association_messages.sql
git commit -m "feat(db): add association_messages table with expiry-based RLS"
```

---

## Task 2: Data layer

**Files:**
- Create: `lib/association-message.ts`

- [ ] **Step 1: Write the file**

```typescript
// lib/association-message.ts
import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export type AssociationMessage = {
  id: string;
  title: string;
  body: string;
  expiresAt: string;
  createdAt: string;
};

export async function getActiveAssociationMessage(): Promise<AssociationMessage | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = createSupabasePublicClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("association_messages")
    .select("id, title, body, expires_at, created_at")
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    title: data.title as string,
    body: data.body as string,
    expiresAt: data.expires_at as string,
    createdAt: data.created_at as string,
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "association-message"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add lib/association-message.ts
git commit -m "feat(lib): add association message data layer"
```

---

## Task 3: Server action

**Files:**
- Create: `app/(protected)/admin/message-association/actions.ts`

- [ ] **Step 1: Write the file**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function publishAssociationMessage(formData: FormData): Promise<void> {
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const expiresAtRaw = (formData.get("expires_at") as string | null)?.trim() ?? "";

  if (!title) redirect("/admin/message-association?error=title-required");
  if (body.length < 10) redirect("/admin/message-association?error=body-too-short");
  if (!expiresAtRaw) redirect("/admin/message-association?error=expiry-required");

  const expiresAt = new Date(expiresAtRaw);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (expiresAt < tomorrow) redirect("/admin/message-association?error=expiry-past");

  const { user } = await requireCompletedProfile("/admin/message-association");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("association_messages").insert({
    title,
    body,
    expires_at: expiresAt.toISOString(),
    created_by: user.id,
  });

  if (error) redirect("/admin/message-association?error=publish-failed");

  revalidatePath("/", "layout");
  redirect("/admin/message-association");
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "message-association/actions"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/admin/message-association/actions.ts"
git commit -m "feat(actions): add publishAssociationMessage server action"
```

---

## Task 4: Admin page

**Files:**
- Create: `app/(protected)/admin/message-association/page.tsx`

- [ ] **Step 1: Write the file**

```tsx
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { requireCompletedProfile } from "@/lib/auth";
import { getActiveAssociationMessage } from "@/lib/association-message";
import { publishAssociationMessage } from "./actions";

export const metadata: Metadata = { title: "Message de l'association" };
export const dynamic = "force-dynamic";

const ERROR_LABELS: Record<string, string> = {
  "title-required": "Le titre est obligatoire.",
  "body-too-short": "Le message doit contenir au moins 10 caractères.",
  "expiry-required": "La date d'expiration est obligatoire.",
  "expiry-past": "La date d'expiration doit être dans le futur.",
  "publish-failed": "La publication a échoué. Veuillez réessayer.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value));
}

function daysUntilExpiry(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryLabel(expiresAt: string): string {
  const days = daysUntilExpiry(expiresAt);
  if (days <= 0) return "Expiré";
  if (days === 1) return "Expire aujourd'hui";
  return `Expire dans ${days} jours`;
}

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function MessageAssociationPage({ searchParams }: Props) {
  await requireCompletedProfile("/admin/message-association");

  const { error } = await searchParams;
  const activeMessage = await getActiveAssociationMessage();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

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
          <div className="eyebrow">Administration</div>
          <h1 className="editorial-title">Message de l&apos;association</h1>
          <p className="text-base leading-7 text-on-surface-variant">
            Publiez un message visible en haut de la page d&apos;accueil pour tous les visiteurs.
          </p>
        </div>

        {/* Error feedback */}
        {error && ERROR_LABELS[error] && (
          <div className="rounded-brand bg-primary/10 px-4 py-3 font-label text-sm font-semibold text-primary">
            {ERROR_LABELS[error]}
          </div>
        )}

        {/* Current active message */}
        <section className="space-y-3">
          <h2 className="font-headline text-lg font-semibold text-on-surface">Message actuel</h2>
          {activeMessage ? (
            <div className="surface-card space-y-3 border-l-4 border-primary/30">
              <p className="font-headline text-base font-semibold text-on-surface">
                {activeMessage.title}
              </p>
              <p className="text-sm leading-7 text-on-surface-variant">{activeMessage.body}</p>
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-label text-xs text-outline">
                  Jusqu&apos;au {formatDate(activeMessage.expiresAt)}
                </span>
                <span
                  className={`font-label text-xs font-semibold ${
                    daysUntilExpiry(activeMessage.expiresAt) <= 1
                      ? "text-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  {expiryLabel(activeMessage.expiresAt)}
                </span>
              </div>
            </div>
          ) : (
            <div className="surface-section">
              <p className="text-sm text-on-surface-variant">Aucun message actif en ce moment.</p>
            </div>
          )}
        </section>

        {/* Publish form */}
        <section className="space-y-4">
          <h2 className="font-headline text-lg font-semibold text-on-surface">
            {activeMessage ? "Publier un nouveau message" : "Publier un message"}
          </h2>
          {activeMessage && (
            <p className="text-sm text-on-surface-variant">
              Le nouveau message remplacera l&apos;actuel dès sa publication.
            </p>
          )}
          <form action={publishAssociationMessage} className="surface-section space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="font-label text-sm font-semibold text-on-surface"
              >
                Titre
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="ex : Fermeture du 15 au 22 août"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="body"
                className="font-label text-sm font-semibold text-on-surface"
              >
                Message
              </label>
              <textarea
                id="body"
                name="body"
                required
                minLength={10}
                rows={4}
                placeholder="Écrivez votre message ici…"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm leading-7 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="expires_at"
                className="font-label text-sm font-semibold text-on-surface"
              >
                Date d&apos;expiration
              </label>
              <input
                id="expires_at"
                name="expires_at"
                type="date"
                required
                min={minDate}
                className="rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
              >
                <Megaphone aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Publier le message
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
npx tsc --noEmit 2>&1 | grep "message-association/page"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/admin/message-association/page.tsx"
git commit -m "feat(admin): add message-association page with publish form"
```

---

## Task 5: Admin hub

**Files:**
- Modify: `app/(protected)/admin/page.tsx`

The current file is just a redirect. Replace it with a proper hub listing admin sections.

- [ ] **Step 1: Replace the file**

```tsx
import Link from "next/link";
import { Megaphone, ShieldAlert } from "lucide-react";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { requireCompletedProfile } from "@/lib/auth";

export default async function AdminPage() {
  await requireCompletedProfile("/admin");

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

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "admin/page"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/admin/page.tsx"
git commit -m "feat(admin): replace redirect with proper hub page"
```

---

## Task 6: Accueil integration

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add import**

At the top of `app/page.tsx`, add this import alongside the existing ones:

```typescript
import { getActiveAssociationMessage } from "@/lib/association-message";
```

- [ ] **Step 2: Add the data fetch**

Inside the `HomePage` function body, alongside the existing fetches, add:

```typescript
const associationMessage = await getActiveAssociationMessage();
```

The full start of the function should now look like:

```typescript
export default async function HomePage() {
  const [{ configured, latestArticle, nextEvent }, { profile }, associationMessage] =
    await Promise.all([
      getPublicContentSnapshot(),
      getCurrentUserContext(),
      getActiveAssociationMessage(),
    ]);
  const todayTip = WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length];
  const shortcuts = getShortcuts(profile?.profileKind);
```

- [ ] **Step 3: Add a date formatter helper**

Add this small helper at module level (near the top, after imports):

```typescript
function formatExpiryDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(
    new Date(value)
  );
}
```

- [ ] **Step 4: Render the block**

Inside the JSX, add the message block **between the personalized greeting and the main hero `<div className="space-y-4">` block**:

```tsx
{/* Association message */}
{associationMessage && (
  <div className="surface-section space-y-2 border-l-4 border-primary/30">
    <div className="eyebrow">Message de l&apos;association</div>
    <p className="font-headline text-xl font-bold text-on-surface">
      {associationMessage.title}
    </p>
    <p className="text-base leading-7 text-on-surface-variant">{associationMessage.body}</p>
    <p className="font-label text-xs text-outline">
      Jusqu&apos;au {formatExpiryDate(associationMessage.expiresAt)}
    </p>
  </div>
)}
```

- [ ] **Step 5: Full typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: same 11 pre-existing errors, zero new ones.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat(accueil): show active association message block"
```

---

## Verification

1. Run `npm run dev`
2. Navigate to `/admin` — should show hub with Modération + Message de l'association cards
3. Click "Message de l'association" → form page
4. Fill in title, body, expiry date (tomorrow) → submit → redirects back, active message shows
5. Navigate to `/` (Accueil) — message block appears between greeting and hero
6. Wait until expiry OR manually update `expires_at` in Supabase to past → Accueil block disappears
7. Navigate back to `/admin/message-association` → "Aucun message actif" shown
