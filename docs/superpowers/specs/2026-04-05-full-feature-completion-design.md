# ROSE-SEIN — Full Feature Completion Design

**Date**: 5 April 2026
**Status**: Approved
**Scope**: Phase A (quick wins), Phase B (Soins de support), Phase C (Communauté, notifications, enhancements)

---

## Context

All 7 MVP tickets (ROS-001 → ROS-007) are complete. The client has provided a 13-section feature wishlist. This spec covers everything needed to bring the app to full feature parity with that list, decomposed into three sequential phases.

### Key decisions made

- **Community model**: Closed/curated — staff creates spaces and threads, members reply only. No open posting.
- **Soins de support**: Dedicated `resources` DB table with category, format, and difficulty fields.
- **Notifications**: In-app bell only (no email/push). `notifications` table, bell in top bar, dropdown list. Email delivery deferred to post-pilot.

---

## Phase A — Quick wins on existing pages

### 1. Accueil personalisation

**File**: `app/page.tsx`

- Import `getCurrentUserContext` (already available in `lib/auth.ts`)
- If user is authenticated and has a profile: render `"Bonjour {displayName}"` above the editorial title
- Wellness tip of the day: static array of ~14 tips (one per day of week × 2), rotated by `new Date().getDay()`. No DB required.
- Next event: already loaded via `getPublicContentSnapshot()` — surface the first upcoming event as a highlighted card above shortcuts
- Profile-adaptive shortcuts: if `profileKind === 'caregiver'` swap the Parcours shortcut label/icon to reflect a caregiver framing

### 2. Actualités — filter + search

**File**: `app/actualites/page.tsx`

- Extract a `NewsFilters` client component (`components/content/news-filters.tsx`)
- Category tabs: derive unique categories from the loaded articles array client-side — no extra query
- Search: controlled text input, filters `articles` array by `title + summary` contains match (client-side, no server round-trip — volume is small)
- Active filter state lives in `useSearchParams` / `router.push` so URLs are shareable
- Empty state: warm copy, link to association messaging

### 3. Association page — membership / donation / volunteer

**File**: `app/association/page.tsx`

- Add three action cards below existing content:
  - Adhérer → external link to `rosesein.org`
  - Faire un don → external link to `rosesein.org`
  - Devenir bénévole → external link to `rosesein.org`
- Each card uses `surface-card` pattern with HeartHandshake / Gift / Users icons

---

## Phase B — Soins de support

### Database

**Migration**: `supabase/migrations/0007_soins_resources.sql`

```sql
create type public.resource_category as enum ('nutrition', 'activite', 'beaute', 'psychologie');
create type public.resource_format as enum ('article', 'video', 'exercise');
create type public.resource_difficulty as enum ('gentle', 'moderate', 'active');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  category public.resource_category not null,
  title text not null,
  summary text not null,
  content jsonb not null default '[]'::jsonb,
  format public.resource_format not null default 'article',
  difficulty public.resource_difficulty not null default 'gentle',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- RLS: public read for published rows, staff insert/update
alter table public.resources enable row level security;

create policy "resources_select_published"
on public.resources for select
using (published_at is not null and published_at <= timezone('utc', now()));

create policy "resources_insert_staff"
on public.resources for insert
with check (public.has_role('admin') or public.has_role('moderator'));

create policy "resources_update_staff"
on public.resources for update
using (public.has_role('admin') or public.has_role('moderator'));
```

### Routes

- `app/soins/page.tsx` — hub with 4 category cards (Nutrition, Activité, Beauté, Psychologie)
- `app/soins/[category]/page.tsx` — resource list filtered by category, with format filter tabs
- `app/soins/[category]/[id]/page.tsx` — resource detail, reuses article detail layout

### Data layer

**File**: `lib/soins.ts`

- `getSoisHub()` — counts per category for the hub cards
- `getResourcesByCategory(category)` — published resources for a category, ordered by `created_at desc`
- `getResourceById(id)` — single resource for detail page
- Content renderer: reuse the existing article content renderer (jsonb block format is identical)

### Component

**File**: `components/content/resource-card.tsx`

- `surface-card` shape
- Category eyebrow (colour-coded: nutrition=primary, activite=secondary, beaute=tertiary, psychologie=primary/10)
- Format icon: `Newspaper` (article), `Play` (video), `Dumbbell` (exercise)
- Difficulty chip: small pill — `Doux`, `Modéré`, `Actif`
- Links to `/soins/[category]/[id]`

### Bottom nav

Adding Soins as a 5th item is too crowded on mobile. Soins is accessible via:
- A prominent shortcut card on Accueil (already stubbed as "Soutiens & ressources")
- The top app bar if needed

Bottom nav final state (set in Phase C when Communauté is added): **Accueil | Communauté | Messages | Parcours** — replacing Actualités with Communauté. Actualités remains reachable from the Accueil shortcuts and top bar.

---

## Phase C — Communauté, Notifications, Well-being

### C1. Community

**Migration**: `supabase/migrations/0008_community.sql`

```sql
create type public.community_kind as enum ('patient', 'caregiver', 'all');

create table public.community_spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon_name text not null default 'Users',
  allowed_kind public.community_kind not null default 'all',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.community_threads (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.community_spaces(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.community_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- RLS
alter table public.community_spaces enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_replies enable row level security;

-- Spaces: public read if active
create policy "community_spaces_select_active"
on public.community_spaces for select using (is_active = true);

-- Threads: authenticated read
create policy "community_threads_select_auth"
on public.community_threads for select using (auth.uid() is not null);

-- Threads: staff insert only (closed model)
create policy "community_threads_insert_staff"
on public.community_threads for insert
with check (public.has_role('admin') or public.has_role('moderator'));

-- Replies: authenticated read
create policy "community_replies_select_auth"
on public.community_replies for select using (auth.uid() is not null);

-- Replies: authenticated members insert own
create policy "community_replies_insert_own"
on public.community_replies for insert
with check (auth.uid() = author_id);
```

**Routes** (all protected):
- `app/(protected)/communaute/page.tsx` — space list
- `app/(protected)/communaute/[spaceSlug]/page.tsx` — thread list for a space
- `app/(protected)/communaute/[spaceSlug]/[threadId]/page.tsx` — thread detail + reply form

**Data layer**: `lib/communaute.ts`
- `getCommunitySpaces()` — active spaces with thread counts
- `getSpaceWithThreads(slug)` — space + its threads ordered pinned first, then by `created_at desc`
- `getThreadWithReplies(threadId)` — thread + replies ordered by `created_at asc`
- `postReply(threadId, body, isAnonymous)` — server action

**Components**:
- `CommunitySpaceCard` — `surface-card`, space icon, title, description, thread count, `allowed_kind` badge
- Reply form: same pattern as message send form (textarea + submit button)

**Bottom nav update**: Replace Actualités with Communauté. Actualités moves to Accueil shortcuts. Final nav: **Accueil | Communauté | Messages | Parcours**.

### C2. In-app notifications

**Migration**: `supabase/migrations/0009_notifications.sql`

```sql
create type public.notification_kind as enum ('message', 'article', 'event', 'community_reply');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index notifications_user_id_created_at_idx
on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
on public.notifications for select using (auth.uid() = user_id);

create policy "notifications_update_own"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

**Data layer**: `lib/notifications.ts`
- `getNotificationSummary(userId)` — last 10 notifications + unread count
- `markAllRead()` — server action, sets `read_at = now()` for all unread rows for current user

**Component**: `NotificationBell` in `components/navigation/top-app-bar.tsx`
- Bell icon (`Bell` from Lucide) with small `bg-primary` dot when unread count > 0
- Click opens a `glass-panel` dropdown anchored below the bell
- Lists last 10 notifications: kind icon, title, body, relative time
- On open: calls `markAllRead()` server action
- Each item links to `href` if present

### C3. Parcours — mood check-in

**No new DB table needed.** Store mood check-ins as `personal_notes` with title `"Humeur — {date}"` and a structured body. This keeps the schema clean and doesn't introduce a new surface to maintain.

UI: small 5-emoji row (😔 😟 😐 🙂 😊) at the top of the Parcours page. Tapping one saves a note silently and shows a brief confirmation. Does not redirect.

---

## Seed data

**File**: `supabase/seed-demo.sql`

### Resources (16 rows)
- Nutrition (4): repas pendant chimio, hydratation, gestion du poids, collations légères
- Activité (4): yoga doux (video), programme de marche, exercices en chaise, étirements du matin
- Beauté (4): soin de la peau pendant traitement, conseils perruque/foulard, atelier socio-esthétique, soin des ongles
- Psychologie (4): exercice de respiration (exercise), prompt de journal, trouver un psychologue, méditation guidée (video)

### Community spaces (4) + threads (3 each) + replies (3 per thread)
- **Espace patientes** (patient): "Comment gérez-vous la fatigue ?", "Vos recettes préférées pendant le traitement", "Conseils pour les rendez-vous médicaux"
- **Espace aidants** (caregiver): "Trouver un équilibre entre soutien et distance", "Parler de la maladie aux enfants", "Prendre soin de soi aussi"
- **Groupe de parole** (all): "Se présenter — dites-nous qui vous êtes", "Ce qui m'a aidée cette semaine", "Questions pour l'association"
- **Mentorat** (all): "Présentation des mentors disponibles", "Comment fonctionne le mentorat ROSE-SEIN", "Témoignages de parcours"

### Notifications (8 rows for demo user)
- 2 × message: "Nouveau message de l'association", "Réponse dans votre fil"
- 2 × article: "Nouvel article publié", "Atelier disponible"
- 2 × event: "Rappel : atelier demain", "Nouvel événement ajouté"
- 2 × community_reply: "Quelqu'un a répondu dans Espace patientes", "Nouveau fil dans Groupe de parole"

### Additional articles (6 rows)
One per filter category to make Actualités tabs feel populated: Médical, Quotidien, Nutrition, Beauté & bien-être, Soins, Événements

---

## Implementation order

1. DB migrations (0007, 0008, 0009) — no UI risk, can be run immediately
2. Seed data — validates migrations, gives content to work with
3. Phase A enhancements (Accueil, Actualités, Association) — low risk, no new routes
4. Phase B: Soins de support (new routes + ResourceCard)
5. Phase C1: Communauté (most complex, depends on migrations)
6. Phase C2: Notifications bell (depends on notifications table)
7. Phase C3: Mood check-in (simplest, depends on nothing new)

---

## What is explicitly NOT in scope

- Email / push notification delivery (wired after pilot)
- Document storage in Parcours (deferred — storage policy not ready)
- Open community posting (closed model only)
- Membership / donation processing (external links to rosesein.org only)
- Téléconsultation, AI orientation, hospital sync (bonus, future phase)
- "Journée difficile" mode (future UX phase)
- Realtime messaging / community updates (future phase)
