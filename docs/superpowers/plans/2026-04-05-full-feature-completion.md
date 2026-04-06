# ROSE-SEIN Full Feature Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all 13 client feature sections — Soins de support, Communauté (closed/curated), in-app notifications, and quick-win enhancements to Accueil, Actualités, Association, and Parcours.

**Architecture:** Three new Supabase migrations (resources, community_*, notifications), new public routes under `/soins`, protected routes under `/communaute`, async `NotificationBell` server component added to `TopAppBar` via `Suspense`, client-side filtering island for `Actualités`. No new npm dependencies.

**Tech Stack:** Next.js 15 App Router, TypeScript 5.8, Supabase (PostgreSQL + RLS), Tailwind CSS 3, Lucide React. Existing patterns: `createSupabasePublicClient` for public data, `createSupabaseServerClient` for auth-gated data, `requireCompletedProfile` for protected server actions.

---

## File map

**New files:**
- `supabase/migrations/0007_soins_resources.sql`
- `supabase/migrations/0008_community.sql`
- `supabase/migrations/0009_notifications.sql`
- `supabase/seed-demo.sql`
- `lib/soins.ts`
- `lib/communaute.ts`
- `lib/notifications.ts`
- `app/soins/page.tsx`
- `app/soins/[category]/page.tsx`
- `app/soins/[category]/[id]/page.tsx`
- `app/(protected)/communaute/page.tsx`
- `app/(protected)/communaute/[spaceSlug]/page.tsx`
- `app/(protected)/communaute/[spaceSlug]/[threadId]/page.tsx`
- `app/(protected)/communaute/[spaceSlug]/[threadId]/actions.ts`
- `components/content/resource-card.tsx`
- `components/content/news-filters.tsx`
- `components/community/community-space-card.tsx`
- `components/notifications/notification-bell.tsx`

**Modified files:**
- `app/page.tsx` — personalised greeting, wellness tip
- `app/actualites/page.tsx` — integrate `NewsFilters`
- `app/association/page.tsx` — membership/donation/volunteer cards
- `app/(protected)/parcours/page.tsx` — mood check-in
- `app/(protected)/parcours/actions.ts` — `saveMoodCheckIn` action
- `components/navigation/bottom-nav.tsx` — Actualités → Communauté
- `components/navigation/top-app-bar.tsx` — add `NotificationBell` via Suspense

---

## Task 1: Database migration — Soins resources

**Files:**
- Create: `supabase/migrations/0007_soins_resources.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0007_soins_resources.sql

do $$ begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'resource_category') then
    create type public.resource_category as enum ('nutrition', 'activite', 'beaute', 'psychologie');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'resource_format') then
    create type public.resource_format as enum ('article', 'video', 'exercise');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'resource_difficulty') then
    create type public.resource_difficulty as enum ('gentle', 'moderate', 'active');
  end if;
end $$;

create table if not exists public.resources (
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

create index if not exists resources_category_published_idx
  on public.resources (category, published_at desc);

drop trigger if exists set_resources_updated_at on public.resources;
create trigger set_resources_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();

alter table public.resources enable row level security;

drop policy if exists "resources_select_published" on public.resources;
create policy "resources_select_published"
  on public.resources for select
  using (published_at is not null and published_at <= timezone('utc', now()));

drop policy if exists "resources_insert_staff" on public.resources;
create policy "resources_insert_staff"
  on public.resources for insert
  with check (public.has_role('admin') or public.has_role('moderator'));

drop policy if exists "resources_update_staff" on public.resources;
create policy "resources_update_staff"
  on public.resources for update
  using (public.has_role('admin') or public.has_role('moderator'));
```

- [ ] **Step 2: Apply to local Supabase**

```bash
npx supabase db push --local
```
Expected: migration applies with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0007_soins_resources.sql
git commit -m "feat(db): add resources table for soins de support"
```

---

## Task 2: Database migration — Community

**Files:**
- Create: `supabase/migrations/0008_community.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0008_community.sql

do $$ begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'community_kind') then
    create type public.community_kind as enum ('patient', 'caregiver', 'all');
  end if;
end $$;

create table if not exists public.community_spaces (
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

create table if not exists public.community_threads (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.community_spaces(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_threads_space_id_idx
  on public.community_threads (space_id, pinned desc, created_at desc);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_replies_thread_id_idx
  on public.community_replies (thread_id, created_at asc);

drop trigger if exists set_community_threads_updated_at on public.community_threads;
create trigger set_community_threads_updated_at
  before update on public.community_threads
  for each row execute function public.set_updated_at();

alter table public.community_spaces enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_replies enable row level security;

-- Spaces: anyone can read active spaces
drop policy if exists "community_spaces_select_active" on public.community_spaces;
create policy "community_spaces_select_active"
  on public.community_spaces for select
  using (is_active = true);

-- Spaces: staff can insert/update
drop policy if exists "community_spaces_insert_staff" on public.community_spaces;
create policy "community_spaces_insert_staff"
  on public.community_spaces for insert
  with check (public.has_role('admin') or public.has_role('moderator'));

-- Threads: authenticated read
drop policy if exists "community_threads_select_auth" on public.community_threads;
create policy "community_threads_select_auth"
  on public.community_threads for select
  using (auth.uid() is not null);

-- Threads: staff insert only (closed community model)
drop policy if exists "community_threads_insert_staff" on public.community_threads;
create policy "community_threads_insert_staff"
  on public.community_threads for insert
  with check (public.has_role('admin') or public.has_role('moderator'));

-- Replies: authenticated read
drop policy if exists "community_replies_select_auth" on public.community_replies;
create policy "community_replies_select_auth"
  on public.community_replies for select
  using (auth.uid() is not null);

-- Replies: members insert their own
drop policy if exists "community_replies_insert_own" on public.community_replies;
create policy "community_replies_insert_own"
  on public.community_replies for insert
  with check (auth.uid() = author_id);
```

- [ ] **Step 2: Apply and verify**

```bash
npx supabase db push --local
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0008_community.sql
git commit -m "feat(db): add community_spaces, community_threads, community_replies tables"
```

---

## Task 3: Database migration — Notifications

**Files:**
- Create: `supabase/migrations/0009_notifications.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0009_notifications.sql

do $$ begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'notification_kind') then
    create type public.notification_kind as enum ('message', 'article', 'event', 'community_reply');
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply and verify**

```bash
npx supabase db push --local
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0009_notifications.sql
git commit -m "feat(db): add notifications table with RLS"
```

---

## Task 4: Seed data

**Files:**
- Create: `supabase/seed-demo.sql`

- [ ] **Step 1: Write the seed file**

```sql
-- supabase/seed-demo.sql
-- Demo seed data for all features. Run after all migrations.
-- Requires at least one admin/moderator user in auth.users to create threads.
-- community_threads.created_by is set to a placeholder that must be replaced
-- with a real user UUID after first admin login.

-- ─── RESOURCES (16 rows) ───────────────────────────────────────────────────

insert into public.resources (category, title, summary, format, difficulty, content, published_at) values
-- Nutrition (4)
('nutrition', 'Alimentation douce pendant les jours de fatigue',
 'Des repères simples pour manger avec régularité sans s'épuiser à cuisiner.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Misez sur des repas fractionnés, faciles à préparer, riches en protéines et pauvres en sucres rapides."},{"type":"quote","text":"L'objectif n'est pas de cuisiner parfaitement — c'est de ne pas se priver."},{"type":"paragraph","text":"Quelques idées : fromage blanc, banane, riz cuit d'avance, œufs mollets, soupes en brique."}]'::jsonb,
 timezone('utc', now()) - interval '5 days'),

('nutrition', 'S'hydrater efficacement pendant le traitement',
 'Boire suffisamment aide à réduire certains effets secondaires. Voici comment y arriver.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"L'eau plate reste la référence. Variez avec tisanes froides, eau citronnée, bouillons légers."},{"type":"paragraph","text":"Évitez les boissons sucrées et l'alcool. En cas de nausées, les petites gorgées fréquentes sont plus efficaces que de grands verres."}]'::jsonb,
 timezone('utc', now()) - interval '4 days'),

('nutrition', 'Maintenir son poids : ni culpabilité ni performance',
 'La relation au corps change pendant le traitement. Quelques repères sans jugement.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Certaines patientes prennent du poids (hormonothérapie), d'autres en perdent (chimio). Les deux sont normaux."},{"type":"paragraph","text":"L'objectif n'est pas de retrouver un \"poids idéal\" mais de maintenir suffisamment d'énergie pour traverser les traitements."}]'::jsonb,
 timezone('utc', now()) - interval '3 days'),

('nutrition', 'Collations légères pour les petits creux',
 'Des idées concrètes pour les moments où l'appétit est réduit mais le corps a besoin de carburant.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Amandes, noix, crackers au sésame, compote sans sucre ajouté, smoothie protéiné léger."},{"type":"quote","text":"Manger peu mais souvent vaut mieux que de sauter un repas."}]'::jsonb,
 timezone('utc', now()) - interval '2 days'),

-- Activité physique (4)
('activite', 'Yoga doux adapté aux traitements',
 'Une séance de 20 minutes conçue pour les jours de fatigue, à faire assise ou allongée.',
 'video', 'gentle',
 '[{"type":"paragraph","text":"Cette vidéo de 20 minutes guide une pratique douce, axée sur la respiration et la mobilité articulaire."},{"type":"paragraph","text":"Pas besoin de tapis ni d'équipement — un lit ou un fauteuil confortable suffit."}]'::jsonb,
 timezone('utc', now()) - interval '6 days'),

('activite', 'Programme de marche progressive sur 4 semaines',
 'Reprendre le mouvement en douceur, à son rythme, avec des objectifs atteignables.',
 'exercise', 'gentle',
 '[{"type":"paragraph","text":"Semaine 1 : 10 minutes de marche lente, 3 fois par semaine."},{"type":"paragraph","text":"Semaine 2 : 15 minutes, 4 fois. Semaine 3 : 20 minutes, 4 fois. Semaine 4 : 25 minutes, 5 fois."},{"type":"quote","text":"Le rythme est le vôtre. Si une semaine est trop difficile, recommencez-la."}]'::jsonb,
 timezone('utc', now()) - interval '7 days'),

('activite', 'Exercices en chaise pour les jours sans énergie',
 'Bouger sans se lever : 8 exercices adaptés à une chaise ordinaire.',
 'exercise', 'gentle',
 '[{"type":"paragraph","text":"Rotations des chevilles, élévations de jambes, étirements des épaules, respiration consciente — chaque geste compte."},{"type":"paragraph","text":"10 minutes suffisent. L'objectif est de maintenir la circulation et réduire la raideur."}]'::jsonb,
 timezone('utc', now()) - interval '1 day'),

('activite', 'Étirements du matin pour bien commencer la journée',
 '5 minutes d'étirements doux pour réveiller le corps sans fatigue.',
 'exercise', 'gentle',
 '[{"type":"paragraph","text":"Commencez allongée : rotations du cou, étirement des bras vers le plafond, torsion douce du buste."},{"type":"paragraph","text":"Prenez le temps de ressentir chaque geste. Aucune douleur ne doit être présente."}]'::jsonb,
 timezone('utc', now()) - interval '8 hours'),

-- Beauté & image de soi (4)
('beaute', 'Prendre soin de sa peau pendant la chimiothérapie',
 'Des conseils concrets pour protéger et hydrater une peau fragilisée par les traitements.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Hydratez deux fois par jour avec une crème sans parfum ni alcool."},{"type":"paragraph","text":"Évitez les savons agressifs. SPF 50 même en hiver sur les zones exposées."},{"type":"quote","text":"Moins c'est plus — une routine simple et constante est plus efficace qu'une accumulation de produits."}]'::jsonb,
 timezone('utc', now()) - interval '3 hours'),

('beaute', 'Perruques, foulards et turbans : trouver son style',
 'Repères pratiques pour choisir, porter et vivre avec ses nouvelles coiffures de traitement.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"La perte de cheveux est temporaire. En attendant, les foulards en bambou sont les plus doux pour le crâne sensibilisé."},{"type":"paragraph","text":"Les perruques peuvent être remboursées en partie — renseignez-vous auprès de votre CPAM ou mutuelle."}]'::jsonb,
 timezone('utc', now()) - interval '2 hours'),

('beaute', 'Atelier socio-esthétique : prendre soin de soi avec douceur',
 'Des ateliers animés par des professionnels formés à l'accompagnement des personnes malades.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Les ateliers socio-esthétiques proposent soins du visage, massage des mains, conseils maquillage — adaptés aux contraintes du traitement."},{"type":"paragraph","text":"ROSE-SEIN est partenaire de la Fédération Nationale de Socio-Esthétique. Contactez l'association pour les prochaines dates."}]'::jsonb,
 timezone('utc', now()) - interval '10 hours'),

('beaute', 'Soin des ongles pendant le traitement',
 'Comment protéger et entretenir des ongles fragilisés par la chimiothérapie.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Les ongles peuvent devenir cassants, décolorés ou se décoller. Des glaçons pendant la perfusion peuvent limiter cet effet."},{"type":"paragraph","text":"Évitez les faux ongles et l'acetone. Hydratez cuticules et ongles chaque soir avec une huile douce."}]'::jsonb,
 timezone('utc', now()) - interval '5 hours'),

-- Psychologie (4)
('psychologie', 'Exercice de respiration : la cohérence cardiaque',
 'Une technique simple de respiration à pratiquer 5 minutes, 3 fois par jour.',
 'exercise', 'gentle',
 '[{"type":"paragraph","text":"Inspirez 5 secondes, expirez 5 secondes, pendant 5 minutes. C'est tout."},{"type":"quote","text":"La régularité prime sur la durée. 5 minutes 3 fois par jour produisent des effets mesurables en quelques semaines."},{"type":"paragraph","text":"Pratiquez le matin, après le déjeuner et avant de dormir."}]'::jsonb,
 timezone('utc', now()) - interval '9 hours'),

('psychologie', 'Tenir un journal personnel : por quoi et comment',
 'Écrire ses pensées aide à traverser les périodes difficiles. Un guide pour commencer.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Pas besoin d'être écrivain. Quelques lignes chaque soir sur ce que vous avez ressenti, ce qui vous a aidée, ce qui vous pèse."},{"type":"paragraph","text":"Le journal n'est pas un outil de performance — c'est un espace pour vous, sans jugement."}]'::jsonb,
 timezone('utc', now()) - interval '4 hours'),

('psychologie', 'Trouver un soutien psychologique adapté',
 'Comment accéder à un accompagnement psy pendant le parcours de soin.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Les services d'oncologie proposent souvent une psychologue intégrée à l'équipe soignante — demandez à votre coordinatrice de soins."},{"type":"paragraph","text":"ROSE-SEIN peut vous orienter vers des psychologues partenaires formés à la psycho-oncologie. Contactez l'association via la messagerie."}]'::jsonb,
 timezone('utc', now()) - interval '6 hours'),

('psychologie', 'Méditation guidée : retrouver un moment de calme',
 'Une session audio de 10 minutes pour se recentrer, même les jours les plus difficiles.',
 'video', 'gentle',
 '[{"type":"paragraph","text":"Installez-vous confortablement, fermez les yeux, et laissez-vous guider par la voix."},{"type":"paragraph","text":"Cette méditation de 10 minutes est conçue pour les personnes en traitement. Pas besoin d'expérience préalable."}]'::jsonb,
 timezone('utc', now()) - interval '7 hours')

on conflict do nothing;

-- ─── COMMUNITY SPACES (4) ────────────────────────────────────────────────────

insert into public.community_spaces (slug, title, description, icon_name, allowed_kind, sort_order) values
('patientes',    'Espace patientes',   'Un espace réservé aux patientes pour partager vécus, astuces et soutien mutuel.',         'Heart',      'patient',   1),
('aidants',      'Espace aidants',     'Pour les proches aidants : questions, ressources et solidarité entre accompagnants.',      'HandHeart',  'caregiver', 2),
('parole',       'Groupe de parole',   'Un cercle d'écoute bienveillant animé par l'association. Ouvert à tous.',                 'MessageCircleHeart', 'all', 3),
('mentorat',     'Mentorat',           'Mise en relation avec des personnes ayant traversé un parcours similaire.',                'Sparkles',   'all',       4)
on conflict (slug) do nothing;

-- ─── COMMUNITY THREADS ───────────────────────────────────────────────────────
-- NOTE: community_threads.created_by requires a real user UUID.
-- These threads will be inserted by an admin via the moderation panel.
-- The seed below uses a placeholder UUID — replace with a real admin user ID
-- before running in production.

-- For demo/local use only:
do $$
declare
  v_patientes uuid;
  v_aidants uuid;
  v_parole uuid;
  v_mentorat uuid;
  v_admin uuid;
begin
  select id into v_patientes from public.community_spaces where slug = 'patientes';
  select id into v_aidants   from public.community_spaces where slug = 'aidants';
  select id into v_parole    from public.community_spaces where slug = 'parole';
  select id into v_mentorat  from public.community_spaces where slug = 'mentorat';

  -- Use first admin user if exists, otherwise skip threads
  select user_id into v_admin from public.user_roles where role = 'admin' limit 1;

  if v_admin is null then
    raise notice 'No admin user found — skipping community thread seed. Create an admin user first.';
    return;
  end if;

  -- Espace patientes threads
  insert into public.community_threads (space_id, title, body, created_by, pinned) values
  (v_patientes, 'Comment gérez-vous la fatigue au quotidien ?',
   'La fatigue est l'un des effets secondaires les plus difficiles à vivre. Quelles stratégies vous aident à traverser les jours les plus lourds ? Partagez vos astuces, grandes ou petites.',
   v_admin, true),
  (v_patientes, 'Vos recettes préférées pendant le traitement',
   'Cuisiner quand on a peu d'énergie et l'appétit capricieux, c'est un vrai défi. Partagez ici vos recettes simples, rapides et qui passent bien même les mauvais jours.',
   v_admin, false),
  (v_patientes, 'Conseils pour les rendez-vous médicaux',
   'Comment vous préparez-vous avant un rendez-vous important ? Questions à poser, documents à apporter, façons de ne pas repartir les mains vides — partagez vos expériences.',
   v_admin, false)
  on conflict do nothing;

  -- Espace aidants threads
  insert into public.community_threads (space_id, title, body, created_by, pinned) values
  (v_aidants, 'Trouver l'équilibre entre soutien et distance',
   'Être présent sans s'effacer, soutenir sans étouffer — c'est un équilibre délicat. Comment trouvez-vous le vôtre ? Quels ajustements avez-vous dû faire dans votre relation ?',
   v_admin, true),
  (v_aidants, 'Parler de la maladie aux enfants',
   'Trouver les bons mots, adapter le discours à l'âge, gérer les questions difficiles... Si vous avez traversé cela, vos retours peuvent aider beaucoup d'autres familles.',
   v_admin, false),
  (v_aidants, 'Prendre soin de soi aussi',
   'En tant qu'aidant, il est facile d'oublier ses propres besoins. Quels gestes vous aident à tenir ? Activité, soutien extérieur, moments pour vous — partagez ce qui fonctionne.',
   v_admin, false)
  on conflict do nothing;

  -- Groupe de parole threads
  insert into public.community_threads (space_id, title, body, created_by, pinned) values
  (v_parole, 'Se présenter — dites-nous qui vous êtes',
   'Bienvenue dans le groupe de parole ROSE-SEIN. Prenez le temps de vous présenter en quelques mots — votre prénom (ou pseudo), où vous en êtes, et ce qui vous a amené(e) ici.',
   v_admin, true),
  (v_parole, 'Ce qui m'a aidé(e) cette semaine',
   'Un espace pour partager un moment positif, une découverte, une petite victoire. Pas d'obligation — mais souvent, mettre des mots dessus fait du bien.',
   v_admin, false),
  (v_parole, 'Questions pour l'association',
   'Vous avez une question sur le fonctionnement de ROSE-SEIN, les ressources disponibles, les événements à venir ? Posez-la ici — un membre de l'équipe répondra.',
   v_admin, false)
  on conflict do nothing;

  -- Mentorat threads
  insert into public.community_threads (space_id, title, body, created_by, pinned) values
  (v_mentorat, 'Présentation des mentors disponibles',
   'Voici les personnes qui ont accepté de partager leur expérience dans un cadre confidentiel et bienveillant. Chaque mentor a traversé un parcours de sein et est formé à l'écoute active.',
   v_admin, true),
  (v_mentorat, 'Comment fonctionne le mentorat ROSE-SEIN ?',
   'Le mentorat est une mise en relation ponctuelle entre une personne qui cherche du soutien et une personne qui a traversé une expérience similaire. Voici comment ça se passe concrètement.',
   v_admin, false),
  (v_mentorat, 'Témoignages — ce que le mentorat a changé',
   'Des témoignages de personnes qui ont bénéficié ou donné du temps dans le cadre du mentorat. Pour comprendre ce que cette relation peut apporter.',
   v_admin, false)
  on conflict do nothing;

end $$;

-- ─── ADDITIONAL ARTICLES (6 rows for filter demo) ────────────────────────────

insert into public.articles (slug, title, summary, category, content, published_at) values
('vivre-avec-incertitude',
 'Vivre avec l'incertitude du diagnostic',
 'Des repères psychologiques pour traverser la période d'attente et d'annonce.',
 'Médical',
 '[{"type":"paragraph","text":"L'attente des résultats est souvent décrite comme l'une des périodes les plus difficiles du parcours."},{"type":"paragraph","text":"Des techniques de pleine conscience et de structuration du quotidien peuvent aider à traverser cette phase."}]'::jsonb,
 timezone('utc', now()) - interval '6 days'),

('organisation-quotidienne-traitement',
 'Organiser son quotidien pendant le traitement',
 'Conseils pratiques pour gérer agenda, énergie et vie sociale pendant les cures.',
 'Quotidien',
 '[{"type":"paragraph","text":"Planifiez les tâches importantes les jours où vous avez le plus d'énergie — souvent 5 à 10 jours après une cure."},{"type":"paragraph","text":"N'hésitez pas à déléguer, simplifier, et dire non sans culpabilité."}]'::jsonb,
 timezone('utc', now()) - interval '4 days'),

('atelier-cuisine-adaptee',
 'Atelier cuisine adaptée : ce que vous pouvez faire chez vous',
 'Les principes de base d'une alimentation adaptée aux effets secondaires des traitements.',
 'Nutrition',
 '[{"type":"paragraph","text":"Les nausées, les mucites et la fatigue changent le rapport à la nourriture. Cuisiner simplement et sans contrainte est possible."},{"type":"paragraph","text":"Misez sur des textures douces, des saveurs neutres, et des petites portions fréquentes."}]'::jsonb,
 timezone('utc', now()) - interval '3 days'),

('maquillage-pendant-chimio',
 'Se maquiller pendant la chimio : le guide doux',
 'Produits adaptés, gestes simples et permissions qu'on ne se donne pas toujours.',
 'Beauté & bien-être',
 '[{"type":"paragraph","text":"Le maquillage peut être un geste de soin, pas une obligation. Si ça vous fait du bien, voici comment adapter votre routine."},{"type":"paragraph","text":"Privilégiez les produits sans parfum, non-comédogènes, et les pinceaux doux. Évitez le mascara waterproof lors de la chute des cils."}]'::jsonb,
 timezone('utc', now()) - interval '2 days'),

('soutien-psycho-oncologie',
 'La psycho-oncologie : une spécialité au service des patients',
 'Ce qu'est la psycho-oncologie, ce qu'elle propose, et comment y accéder.',
 'Soins',
 '[{"type":"paragraph","text":"La psycho-oncologie accompagne le vécu émotionnel du cancer : annonce, traitement, rémission, rechute."},{"type":"paragraph","text":"Elle est accessible dans la plupart des centres de lutte contre le cancer et peut être proposée dès le diagnostic."}]'::jsonb,
 timezone('utc', now()) - interval '1 day'),

('evenement-octobre-rose',
 'Octobre Rose 2026 : les événements ROSE-SEIN',
 'Toutes les dates et activités prévues par l'association pour le mois d'octobre.',
 'Événements',
 '[{"type":"paragraph","text":"Cette année, ROSE-SEIN organise des ateliers, des marches solidaires, des conférences et des temps de partage tout au long du mois d'octobre."},{"type":"paragraph","text":"Retrouvez le programme complet dans l'onglet Événements de cette page."}]'::jsonb,
 timezone('utc', now()) - interval '12 hours')

on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  category = excluded.category,
  content = excluded.content,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());
```

- [ ] **Step 2: Apply seed to local DB**

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/seed-demo.sql
```
Expected: rows inserted, notice about admin user if none exists.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed-demo.sql
git commit -m "feat(seed): add demo seed data for resources, community, articles, notifications"
```

---

## Task 5: Data layer — lib/soins.ts

**Files:**
- Create: `lib/soins.ts`

- [ ] **Step 1: Write the file**

```typescript
// lib/soins.ts
import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { ArticleBlock } from "@/lib/content";

export type ResourceCategory = "nutrition" | "activite" | "beaute" | "psychologie";
export type ResourceFormat = "article" | "video" | "exercise";
export type ResourceDifficulty = "gentle" | "moderate" | "active";

export type PublishedResource = {
  id: string;
  category: ResourceCategory;
  title: string;
  summary: string;
  format: ResourceFormat;
  difficulty: ResourceDifficulty;
  publishedAt: string;
};

export type FullResource = PublishedResource & {
  content: ArticleBlock[];
};

export type ResourceCategoryCounts = Record<ResourceCategory, number>;

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  nutrition: "Nutrition",
  activite: "Activité physique",
  beaute: "Beauté & image",
  psychologie: "Soutien psychologique",
};

const CATEGORY_DESCRIPTIONS: Record<ResourceCategory, string> = {
  nutrition: "Conseils alimentaires, recettes adaptées et repères pour manger avec douceur pendant les traitements.",
  activite: "Programmes de mouvement doux, vidéos guidées et exercices adaptés à votre niveau d'énergie.",
  beaute: "Soins de la peau, conseils coiffure, ateliers socio-esthétiques et gestes beauté bienveillants.",
  psychologie: "Exercices de respiration, journal personnel, méditation et orientation vers un soutien professionnel.",
};

export function getCategoryLabel(category: ResourceCategory): string {
  return CATEGORY_LABELS[category];
}

export function getCategoryDescription(category: ResourceCategory): string {
  return CATEGORY_DESCRIPTIONS[category];
}

export function isResourceCategory(value: string): value is ResourceCategory {
  return ["nutrition", "activite", "beaute", "psychologie"].includes(value);
}

type ResourceRow = {
  id: string;
  category: string;
  title: string;
  summary: string;
  format: string;
  difficulty: string;
  published_at: string;
};

function toPublishedResource(row: ResourceRow): PublishedResource {
  return {
    id: row.id,
    category: row.category as ResourceCategory,
    title: row.title,
    summary: row.summary,
    format: row.format as ResourceFormat,
    difficulty: row.difficulty as ResourceDifficulty,
    publishedAt: row.published_at,
  };
}

export async function getResourceCategoryCounts(): Promise<ResourceCategoryCounts> {
  const empty: ResourceCategoryCounts = { nutrition: 0, activite: 0, beaute: 0, psychologie: 0 };
  if (!hasSupabaseBrowserEnv()) return empty;

  const supabase = createSupabasePublicClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("resources")
    .select("category")
    .not("published_at", "is", null)
    .lte("published_at", nowIso);

  if (!data) return empty;

  return (data as { category: string }[]).reduce((acc, row) => {
    const cat = row.category as ResourceCategory;
    if (cat in acc) acc[cat]++;
    return acc;
  }, { ...empty });
}

export async function getResourcesByCategory(category: ResourceCategory): Promise<PublishedResource[]> {
  if (!hasSupabaseBrowserEnv()) return [];

  const supabase = createSupabasePublicClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("resources")
    .select("id, category, title, summary, format, difficulty, published_at")
    .eq("category", category)
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false });

  return ((data ?? []) as ResourceRow[]).map(toPublishedResource);
}

function isArticleBlock(value: unknown): value is ArticleBlock {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.type !== "string") return false;
  switch (v.type) {
    case "paragraph":
    case "quote":
      return typeof v.text === "string";
    case "heading":
      return typeof v.text === "string";
    case "image":
      return typeof v.src === "string" && typeof v.alt === "string";
    default:
      return false;
  }
}

export async function getResourceById(id: string): Promise<FullResource | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = createSupabasePublicClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("resources")
    .select("id, category, title, summary, format, difficulty, content, published_at")
    .eq("id", id)
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .maybeSingle();

  if (!data) return null;
  const r = data as ResourceRow & { content: unknown };

  return {
    ...toPublishedResource(r),
    content: Array.isArray(r.content) ? (r.content as unknown[]).filter(isArticleBlock) : [],
  };
}

export function formatDifficulty(difficulty: ResourceDifficulty): string {
  return { gentle: "Doux", moderate: "Modéré", active: "Actif" }[difficulty];
}

export function formatFormat(format: ResourceFormat): string {
  return { article: "Article", video: "Vidéo", exercise: "Exercice" }[format];
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/soins.ts
git commit -m "feat(lib): add soins data layer"
```

---

## Task 6: ResourceCard component

**Files:**
- Create: `components/content/resource-card.tsx`

- [ ] **Step 1: Write the component**

```typescript
// components/content/resource-card.tsx
import Link from "next/link";
import { ArrowRight, Dumbbell, Newspaper, Play } from "lucide-react";

import type { PublishedResource, ResourceFormat, ResourceDifficulty } from "@/lib/soins";
import { formatDifficulty, formatFormat } from "@/lib/soins";

const FORMAT_ICONS: Record<ResourceFormat, typeof Newspaper> = {
  article: Newspaper,
  video: Play,
  exercise: Dumbbell,
};

const DIFFICULTY_COLOURS: Record<ResourceDifficulty, string> = {
  gentle: "bg-secondary-container text-on-secondary-container",
  moderate: "bg-primary/10 text-primary",
  active: "bg-primary/20 text-primary",
};

type Props = {
  resource: PublishedResource;
};

export function ResourceCard({ resource }: Props) {
  const FormatIcon = FORMAT_ICONS[resource.format];

  return (
    <article className="surface-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FormatIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 font-label text-xs font-semibold ${DIFFICULTY_COLOURS[resource.difficulty]}`}
        >
          {formatDifficulty(resource.difficulty)}
        </span>
      </div>

      <div>
        <p className="eyebrow">{formatFormat(resource.format)}</p>
        <h3 className="mt-1 font-headline text-lg font-semibold text-on-surface">
          {resource.title}
        </h3>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">{resource.summary}</p>
      </div>

      <Link
        href={`/soins/${resource.category}/${resource.id}`}
        className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
      >
        Voir le contenu
        <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
      </Link>
    </article>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/content/resource-card.tsx
git commit -m "feat(components): add ResourceCard for soins resources"
```

---

## Task 7: Soins pages

**Files:**
- Create: `app/soins/page.tsx`
- Create: `app/soins/[category]/page.tsx`
- Create: `app/soins/[category]/[id]/page.tsx`

- [ ] **Step 1: Write the hub page**

```typescript
// app/soins/page.tsx
import Link from "next/link";
import { ArrowRight, Dumbbell, HeartPulse, Leaf, Smile } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { getResourceCategoryCounts } from "@/lib/soins";
import type { ResourceCategory } from "@/lib/soins";

export const revalidate = 300;

const CATEGORY_CONFIG: {
  category: ResourceCategory;
  label: string;
  description: string;
  icon: typeof Leaf;
  tone: string;
}[] = [
  {
    category: "nutrition",
    label: "Nutrition",
    description: "Conseils alimentaires et recettes adaptées aux traitements.",
    icon: Leaf,
    tone: "bg-primary/10 text-primary",
  },
  {
    category: "activite",
    label: "Activité physique",
    description: "Programmes doux, vidéos guidées et exercices adaptés.",
    icon: Dumbbell,
    tone: "bg-secondary-container text-on-secondary-container",
  },
  {
    category: "beaute",
    label: "Beauté & image",
    description: "Soins de la peau, conseils coiffure, ateliers socio-esthétiques.",
    icon: Smile,
    tone: "bg-primary/10 text-primary",
  },
  {
    category: "psychologie",
    label: "Soutien psychologique",
    description: "Respiration, journal personnel, méditation et orientation professionnelle.",
    icon: HeartPulse,
    tone: "bg-secondary-container text-on-secondary-container",
  },
];

export default async function SoisHubPage() {
  const counts = await getResourceCategoryCounts();

  return (
    <AppShell title="Soins de support" currentPath="/soins">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Prendre soin de soi</div>
          <h1 className="editorial-title">Des ressources pensées pour votre parcours.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Nutrition, activité physique, image de soi, soutien psychologique — chaque
            espace rassemble des contenus validés, adaptés aux réalités du traitement.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORY_CONFIG.map(({ category, label, description, icon: Icon, tone }) => (
            <Link key={category} href={`/soins/${category}`} className="surface-card group space-y-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}>
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">{label}</h2>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">{description}</p>
                <p className="mt-2 font-label text-xs font-semibold uppercase tracking-[0.16em] text-outline">
                  {counts[category]} ressource{counts[category] !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
                Explorer
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.8} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 2: Write the category page**

```typescript
// app/soins/[category]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ResourceCard } from "@/components/content/resource-card";
import {
  getResourcesByCategory,
  getCategoryLabel,
  getCategoryDescription,
  isResourceCategory,
} from "@/lib/soins";

export const revalidate = 300;

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isResourceCategory(category)) return { title: "Catégorie introuvable" };
  return { title: getCategoryLabel(category), description: getCategoryDescription(category) };
}

export default async function SoinsCategoryPage({ params }: Props) {
  const { category } = await params;

  if (!isResourceCategory(category)) notFound();

  const resources = await getResourcesByCategory(category);

  return (
    <AppShell title="Soins de support" currentPath="/soins">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Soins de support</div>
          <h1 className="editorial-title">{getCategoryLabel(category)}</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            {getCategoryDescription(category)}
          </p>
        </div>

        {resources.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Aucune ressource disponible pour le moment
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              L'équipe éditoriale prépare des contenus pour cet espace.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 3: Write the resource detail page**

```typescript
// app/soins/[category]/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ArticleContent } from "@/components/content/article-content";
import {
  getResourceById,
  getCategoryLabel,
  isResourceCategory,
  formatDifficulty,
  formatFormat,
} from "@/lib/soins";

export const revalidate = 300;

type Props = { params: Promise<{ category: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resource = await getResourceById(id);
  if (!resource) return { title: "Ressource introuvable" };
  return { title: resource.title, description: resource.summary };
}

export default async function ResourceDetailPage({ params }: Props) {
  const { category, id } = await params;

  if (!isResourceCategory(category)) notFound();

  const resource = await getResourceById(id);
  if (!resource) notFound();

  return (
    <AppShell title="Soins de support" currentPath="/soins">
      <section className="space-y-6">
        <Link
          href={`/soins/${category}`}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour à {getCategoryLabel(category)}
        </Link>

        <div className="surface-section space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">{getCategoryLabel(resource.category)}</p>
            <span className="rounded-full bg-secondary-container px-3 py-1 font-label text-xs font-semibold text-on-secondary-container">
              {formatFormat(resource.format)}
            </span>
            <span className="rounded-full bg-surface-container-high px-3 py-1 font-label text-xs font-semibold text-on-surface-variant">
              {formatDifficulty(resource.difficulty)}
            </span>
          </div>
          <h1 className="editorial-title">{resource.title}</h1>
          <p className="text-base leading-7 text-on-surface-variant">{resource.summary}</p>
        </div>

        {resource.content.length > 0 && (
          <div className="surface-card">
            <ArticleContent blocks={resource.content} />
          </div>
        )}
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add app/soins/
git commit -m "feat(soins): add Soins de support hub, category, and detail pages"
```

---

## Task 8: Data layer — lib/communaute.ts

**Files:**
- Create: `lib/communaute.ts`

- [ ] **Step 1: Write the file**

```typescript
// lib/communaute.ts
import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CommunityKind = "patient" | "caregiver" | "all";

export type CommunitySpace = {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconName: string;
  allowedKind: CommunityKind;
  sortOrder: number;
  threadCount: number;
};

export type CommunityThread = {
  id: string;
  spaceId: string;
  title: string;
  body: string;
  createdBy: string;
  pinned: boolean;
  createdAt: string;
  replyCount: number;
};

export type CommunityReply = {
  id: string;
  threadId: string;
  authorId: string;
  authorDisplayName: string;
  body: string;
  isAnonymous: boolean;
  createdAt: string;
};

export type SpaceWithThreads = {
  space: CommunitySpace;
  threads: CommunityThread[];
};

export type ThreadWithReplies = {
  thread: CommunityThread & { spaceSlug: string; spaceTitle: string };
  replies: CommunityReply[];
};

export async function getCommunitySpaces(): Promise<CommunitySpace[]> {
  if (!hasSupabaseBrowserEnv()) return [];

  const supabase = await createSupabaseServerClient();

  const { data: spaces } = await supabase
    .from("community_spaces")
    .select("id, slug, title, description, icon_name, allowed_kind, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!spaces) return [];

  const spaceIds = spaces.map((s) => s.id as string);

  const { data: threadCounts } = await supabase
    .from("community_threads")
    .select("space_id")
    .in("space_id", spaceIds);

  const countMap = new Map<string, number>();
  for (const row of threadCounts ?? []) {
    const id = (row as { space_id: string }).space_id;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  return (spaces as {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon_name: string;
    allowed_kind: string;
    sort_order: number;
  }[]).map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    iconName: s.icon_name,
    allowedKind: s.allowed_kind as CommunityKind,
    sortOrder: s.sort_order,
    threadCount: countMap.get(s.id) ?? 0,
  }));
}

export async function getSpaceWithThreads(slug: string): Promise<SpaceWithThreads | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = await createSupabaseServerClient();

  const { data: space } = await supabase
    .from("community_spaces")
    .select("id, slug, title, description, icon_name, allowed_kind, sort_order")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!space) return null;

  const s = space as {
    id: string; slug: string; title: string; description: string;
    icon_name: string; allowed_kind: string; sort_order: number;
  };

  const { data: threads } = await supabase
    .from("community_threads")
    .select("id, space_id, title, body, created_by, pinned, created_at")
    .eq("space_id", s.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const threadIds = (threads ?? []).map((t) => (t as { id: string }).id);

  const { data: replyCounts } = await supabase
    .from("community_replies")
    .select("thread_id")
    .in("thread_id", threadIds.length > 0 ? threadIds : ["00000000-0000-0000-0000-000000000000"]);

  const replyMap = new Map<string, number>();
  for (const row of replyCounts ?? []) {
    const id = (row as { thread_id: string }).thread_id;
    replyMap.set(id, (replyMap.get(id) ?? 0) + 1);
  }

  return {
    space: {
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      iconName: s.icon_name,
      allowedKind: s.allowed_kind as CommunityKind,
      sortOrder: s.sort_order,
      threadCount: (threads ?? []).length,
    },
    threads: ((threads ?? []) as {
      id: string; space_id: string; title: string; body: string;
      created_by: string; pinned: boolean; created_at: string;
    }[]).map((t) => ({
      id: t.id,
      spaceId: t.space_id,
      title: t.title,
      body: t.body,
      createdBy: t.created_by,
      pinned: t.pinned,
      createdAt: t.created_at,
      replyCount: replyMap.get(t.id) ?? 0,
    })),
  };
}

export async function getThreadWithReplies(threadId: string): Promise<ThreadWithReplies | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = await createSupabaseServerClient();

  const { data: thread } = await supabase
    .from("community_threads")
    .select("id, space_id, title, body, created_by, pinned, created_at, community_spaces(slug, title)")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return null;

  const t = thread as {
    id: string; space_id: string; title: string; body: string;
    created_by: string; pinned: boolean; created_at: string;
    community_spaces: { slug: string; title: string } | null;
  };

  const { data: replies } = await supabase
    .from("community_replies")
    .select("id, thread_id, author_id, body, is_anonymous, created_at, profiles(display_name, pseudonym, is_anonymous)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return {
    thread: {
      id: t.id,
      spaceId: t.space_id,
      title: t.title,
      body: t.body,
      createdBy: t.created_by,
      pinned: t.pinned,
      createdAt: t.created_at,
      replyCount: (replies ?? []).length,
      spaceSlug: t.community_spaces?.slug ?? "",
      spaceTitle: t.community_spaces?.title ?? "",
    },
    replies: ((replies ?? []) as {
      id: string; thread_id: string; author_id: string; body: string;
      is_anonymous: boolean; created_at: string;
      profiles: { display_name: string; pseudonym: string | null; is_anonymous: boolean } | null;
    }[]).map((r) => {
      const showAnon = r.is_anonymous || (r.profiles?.is_anonymous ?? false);
      const name = showAnon
        ? "Membre anonyme"
        : (r.profiles?.pseudonym ?? r.profiles?.display_name ?? "Membre");
      return {
        id: r.id,
        threadId: r.thread_id,
        authorId: r.author_id,
        authorDisplayName: name,
        body: r.body,
        isAnonymous: showAnon,
        createdAt: r.created_at,
      };
    }),
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/communaute.ts
git commit -m "feat(lib): add communauté data layer"
```

---

## Task 9: CommunitySpaceCard + Community pages + reply action

**Files:**
- Create: `components/community/community-space-card.tsx`
- Create: `app/(protected)/communaute/page.tsx`
- Create: `app/(protected)/communaute/[spaceSlug]/page.tsx`
- Create: `app/(protected)/communaute/[spaceSlug]/[threadId]/page.tsx`
- Create: `app/(protected)/communaute/[spaceSlug]/[threadId]/actions.ts`

- [ ] **Step 1: Write CommunitySpaceCard**

```typescript
// components/community/community-space-card.tsx
import Link from "next/link";
import { ArrowRight, Heart, HandHeart, MessageCircleHeart, Sparkles, Users } from "lucide-react";
import type { CommunitySpace } from "@/lib/communaute";

const ICON_MAP: Record<string, typeof Users> = {
  Heart, HandHeart, MessageCircleHeart, Sparkles, Users,
};

const KIND_LABELS: Record<string, string> = {
  patient: "Patientes",
  caregiver: "Aidants",
  all: "Ouvert à tous",
};

type Props = { space: CommunitySpace };

export function CommunitySpaceCard({ space }: Props) {
  const Icon = ICON_MAP[space.iconName] ?? Users;

  return (
    <Link href={`/communaute/${space.slug}`} className="surface-card group space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <span className="rounded-full bg-secondary-container px-3 py-1 font-label text-xs font-semibold text-on-secondary-container">
          {KIND_LABELS[space.allowedKind] ?? space.allowedKind}
        </span>
      </div>
      <div>
        <h2 className="font-headline text-lg font-semibold text-on-surface">{space.title}</h2>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">{space.description}</p>
        <p className="mt-2 font-label text-xs font-semibold uppercase tracking-[0.16em] text-outline">
          {space.threadCount} fil{space.threadCount !== 1 ? "s" : ""}
        </p>
      </div>
      <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
        Entrer dans l&apos;espace
        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.8} />
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Write the community hub page**

```typescript
// app/(protected)/communaute/page.tsx
import { AppShell } from "@/components/shell/app-shell";
import { CommunitySpaceCard } from "@/components/community/community-space-card";
import { getCommunitySpaces } from "@/lib/communaute";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const spaces = await getCommunitySpaces();

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Espaces bienveillants</div>
          <h1 className="editorial-title">Vous n&apos;êtes pas seul·e.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Des espaces animés par l&apos;association, ouverts aux échanges,
            aux questions et au soutien mutuel. Chaque fil est créé et modéré
            par l&apos;équipe ROSE-SEIN.
          </p>
        </div>

        {spaces.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {spaces.map((space) => (
              <CommunitySpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Les espaces arrivent bientôt
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              L&apos;équipe prépare les premiers espaces de discussion.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 3: Write the space page (thread list)**

```typescript
// app/(protected)/communaute/[spaceSlug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle, Pin } from "lucide-react";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { getSpaceWithThreads } from "@/lib/communaute";

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

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <Link
          href="/communaute"
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
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/communaute/${spaceSlug}/${thread.id}`}
                className="surface-card group flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {thread.pinned && (
                      <Pin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                    )}
                    <p className="font-headline text-base font-semibold text-on-surface">
                      {thread.title}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-7 text-on-surface-variant">
                    {thread.body}
                  </p>
                  <div className="mt-2 flex items-center gap-1 font-label text-xs text-outline">
                    <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {thread.replyCount} réponse{thread.replyCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-outline transition-transform group-hover:translate-x-1"
                  strokeWidth={1.8}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Aucun fil pour le moment
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              L&apos;équipe prépare les premiers sujets de discussion.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 4: Write the thread detail page**

```typescript
// app/(protected)/communaute/[spaceSlug]/[threadId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { getThreadWithReplies } from "@/lib/communaute";
import { postReply } from "./actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ spaceSlug: string; threadId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { threadId } = await params;
  const result = await getThreadWithReplies(threadId);
  if (!result) return { title: "Fil introuvable" };
  return { title: result.thread.title };
}

function formatRelativeDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ThreadPage({ params }: Props) {
  const { spaceSlug, threadId } = await params;
  const result = await getThreadWithReplies(threadId);

  if (!result) notFound();

  const { thread, replies } = result;

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <Link
          href={`/communaute/${spaceSlug}`}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour à {thread.spaceTitle}
        </Link>

        <div className="surface-section space-y-3">
          <div className="eyebrow">{thread.spaceTitle}</div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">{thread.title}</h1>
          <p className="text-base leading-8 text-on-surface-variant">{thread.body}</p>
        </div>

        <section className="space-y-4">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            {replies.length} réponse{replies.length !== 1 ? "s" : ""}
          </h2>

          {replies.map((reply) => (
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
            </article>
          ))}

          <section className="surface-section space-y-4">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Ajouter une réponse
            </h2>
            <form action={postReply} className="space-y-4">
              <input type="hidden" name="threadId" value={threadId} />
              <input type="hidden" name="spaceSlug" value={spaceSlug} />

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Votre message
                </span>
                <textarea
                  name="body"
                  rows={4}
                  required
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                  placeholder="Partagez votre expérience, vos questions ou votre soutien..."
                />
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-sm text-on-surface-variant">
                  Répondre anonymement (votre nom ne sera pas affiché)
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
              >
                Publier la réponse
              </button>
            </form>
          </section>
        </section>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 5: Write the reply server action**

```typescript
// app/(protected)/communaute/[spaceSlug]/[threadId]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function postReply(formData: FormData) {
  const threadId = formData.get("threadId");
  const spaceSlug = formData.get("spaceSlug");
  const body = typeof formData.get("body") === "string"
    ? (formData.get("body") as string).trim()
    : "";
  const isAnonymous = formData.get("isAnonymous") === "on";

  if (typeof threadId !== "string" || !threadId) {
    redirect("/communaute");
  }

  if (body.length < 2) {
    redirect(`/communaute/${spaceSlug}/${threadId}?error=body-required`);
  }

  const { user } = await requireCompletedProfile("/communaute");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("community_replies").insert({
    thread_id: threadId,
    author_id: user.id,
    body,
    is_anonymous: isAnonymous,
  });

  if (error) {
    redirect(`/communaute/${spaceSlug}/${threadId}?error=reply-failed`);
  }

  revalidatePath(`/communaute/${spaceSlug}/${threadId}`);
  redirect(`/communaute/${spaceSlug}/${threadId}`);
}
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add components/community/ app/\(protected\)/communaute/
git commit -m "feat(communauté): add community spaces, threads, and reply flow"
```

---

## Task 10: Data layer — lib/notifications.ts

**Files:**
- Create: `lib/notifications.ts`

- [ ] **Step 1: Write the file**

```typescript
// lib/notifications.ts
"use server";

import { revalidatePath } from "next/cache";

import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type NotificationKind = "message" | "article" | "event" | "community_reply";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationSummary = {
  notifications: AppNotification[];
  unreadCount: number;
};

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getNotificationSummary(): Promise<NotificationSummary> {
  const empty: NotificationSummary = { notifications: [], unreadCount: 0 };
  if (!hasSupabaseBrowserEnv()) return empty;

  const { user } = await getCurrentUser();
  if (!user) return empty;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const notifications = ((data ?? []) as NotificationRow[]).map((row) => ({
    id: row.id,
    kind: row.kind as NotificationKind,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.readAt).length,
  };
}

export async function markAllNotificationsRead() {
  if (!hasSupabaseBrowserEnv()) return;

  const { user } = await getCurrentUser();
  if (!user) return;

  const supabase = await createSupabaseServerClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/", "layout");
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/notifications.ts
git commit -m "feat(lib): add notifications data layer and markAllRead action"
```

---

## Task 11: NotificationBell component + TopAppBar update

**Files:**
- Create: `components/notifications/notification-bell.tsx`
- Modify: `components/navigation/top-app-bar.tsx`

- [ ] **Step 1: Write NotificationBell**

```typescript
// components/notifications/notification-bell.tsx
import { Bell, CalendarRange, MessageCircleMore, Newspaper, Users } from "lucide-react";

import { getNotificationSummary, markAllNotificationsRead } from "@/lib/notifications";
import type { NotificationKind } from "@/lib/notifications";

const KIND_ICONS: Record<NotificationKind, typeof Bell> = {
  message: MessageCircleMore,
  article: Newspaper,
  event: CalendarRange,
  community_reply: Users,
};

function formatRelative(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

export async function NotificationBell() {
  const { notifications, unreadCount } = await getNotificationSummary();

  return (
    <details className="relative">
      <summary
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} non lues` : ""}`}
      >
        <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary" />
        )}
      </summary>

      <div className="glass-panel absolute right-0 top-14 z-50 w-80 rounded-brand-md shadow-ambient">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-headline text-sm font-semibold text-on-surface">Notifications</p>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="font-label text-xs font-semibold text-primary"
              >
                Tout marquer comme lu
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-on-surface-variant">Aucune notification.</p>
        ) : (
          <ul className="max-h-80 divide-y divide-outline-variant/30 overflow-y-auto">
            {notifications.map((notif) => {
              const Icon = KIND_ICONS[notif.kind];
              const inner = (
                <li
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 ${!notif.readAt ? "bg-primary/5" : ""}`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface">{notif.title}</p>
                    {notif.body && (
                      <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">{notif.body}</p>
                    )}
                    <p className="mt-1 font-label text-[11px] text-outline">
                      {formatRelative(notif.createdAt)}
                    </p>
                  </div>
                </li>
              );

              return notif.href ? (
                <a key={notif.id} href={notif.href} className="block hover:bg-surface-container-low">
                  {inner}
                </a>
              ) : (
                <div key={notif.id}>{inner}</div>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}
```

- [ ] **Step 2: Update TopAppBar to include NotificationBell**

Replace the full contents of `components/navigation/top-app-bar.tsx`:

```typescript
// components/navigation/top-app-bar.tsx
import Link from "next/link";
import { LifeBuoy, Settings2 } from "lucide-react";
import { Suspense } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";

type TopAppBarProps = {
  title?: string;
};

export function TopAppBar({ title }: TopAppBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 mx-auto max-w-screen-md px-4 pt-4">
      <div className="glass-panel rounded-brand-xl flex items-center justify-between px-5 py-3 shadow-ambient">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary font-headline text-sm font-bold text-on-primary">
            RS
          </div>
          <div>
            <p className="font-label text-xs uppercase tracking-[0.16em] text-primary">
              ROSE-SEIN
            </p>
            <p className="font-headline text-sm font-semibold text-on-surface">
              {title ?? "Digital Sanctuary"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low" />
          }>
            <NotificationBell />
          </Suspense>
          <Link
            href="/aide"
            aria-label="Ouvrir l'aide"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <LifeBuoy aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <Link
            href="/account"
            aria-label="Ouvrir le compte"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Settings2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/notifications/ components/navigation/top-app-bar.tsx
git commit -m "feat(notifications): add NotificationBell to TopAppBar via Suspense"
```

---

## Task 12: Phase A — Accueil personalisation

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Read the current file**

Read `app/page.tsx` fully before editing. The current file uses `getPublicContentSnapshot()` and renders static shortcuts. Changes needed:
1. Import `getCurrentUserContext` from `@/lib/auth`
2. Add a `WELLNESS_TIPS` array of 14 strings
3. Render a personalised greeting section when user has a profile
4. Surface the `nextEvent` as a highlighted card

- [ ] **Step 2: Add imports and wellness tips**

Add at the top of `app/page.tsx` after existing imports:

```typescript
import { getCurrentUserContext } from "@/lib/auth";

const WELLNESS_TIPS = [
  "Aujourd'hui, accordez-vous une pause sans écrans — même 10 minutes font la différence.",
  "Boire un grand verre d'eau le matin aide le corps à démarrer plus doucement.",
  "Un geste de douceur envers vous-même compte autant qu'un rendez-vous médical.",
  "La respiration lente active le système nerveux parasympathique. Essayez 4 secondes / 4 secondes.",
  "Dire non à quelque chose d'épuisant, c'est dire oui à votre énergie.",
  "Une courte promenade, même lente, change l'état d'esprit.",
  "Notez une chose qui s'est bien passée aujourd'hui, aussi petite soit-elle.",
  "Le repos n'est pas de la paresse — c'est une partie du soin.",
  "Demander de l'aide est un acte de courage, pas de faiblesse.",
  "Votre corps fait un travail immense. Remerciez-le à votre façon.",
  "Manger quelque chose que vous aimez, c'est déjà prendre soin de vous.",
  "Aujourd'hui, une seule chose à la fois suffit.",
  "Un échange avec quelqu'un de confiance peut alléger le poids du quotidien.",
  "Vous traversez quelque chose de difficile. C'est réel, et votre ressenti est valide.",
];
```

- [ ] **Step 3: Update the page component**

Change `HomePage` to fetch user context and render greeting + wellness tip:

```typescript
export default async function HomePage() {
  const { configured, latestArticle, nextEvent } = await getPublicContentSnapshot();
  const { profile } = await getCurrentUserContext();

  const todayTip = WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length];

  return (
    <AppShell currentPath="/">
      <section className="space-y-8">

        {/* Personalised greeting */}
        {profile && (
          <div className="surface-section flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-headline text-sm font-bold text-on-primary">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-headline text-2xl font-bold text-on-surface">
                Bonjour, {profile.pseudonym ?? profile.displayName} 🌸
              </p>
              <p className="mt-1 text-sm leading-7 text-on-surface-variant">{todayTip}</p>
            </div>
          </div>
        )}

        {/* existing hero section — keep as-is below */}
```

Keep all existing JSX after this point. The personalised greeting is inserted before the existing `<div className="space-y-4">` hero block.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat(accueil): add personalised greeting and daily wellness tip"
```

---

## Task 13: Phase A — Actualités filter

**Files:**
- Create: `components/content/news-filters.tsx`
- Modify: `app/actualites/page.tsx`

- [ ] **Step 1: Write the NewsFilters client component**

```typescript
// components/content/news-filters.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange, ExternalLink, Newspaper, Search, ShieldCheck } from "lucide-react";

import type { PublishedArticle, PublishedEvent } from "@/lib/content";
import { formatEventSchedule, formatPublishedDate } from "@/lib/content";

type Props = {
  articles: PublishedArticle[];
  events: PublishedEvent[];
  configured: boolean;
};

export function NewsFilters({ articles, events, configured }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Tout");

  const allCategories = ["Tout", ...Array.from(new Set(articles.map((a) => a.category))).sort()];

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      search.trim() === "" ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Tout" || a.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
          strokeWidth={1.8}
        />
        <input
          type="search"
          placeholder="Rechercher un sujet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-brand bg-surface-container-high py-4 pl-11 pr-4 text-sm text-on-surface placeholder:text-outline"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2 font-label text-sm font-semibold transition-colors ${
              activeCategory === cat
                ? "bg-gradient-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div>
        <div className="eyebrow mb-3">Articles</div>
        {filteredArticles.length > 0 ? (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <article key={article.id} className="surface-card space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Newspaper aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <p className="eyebrow">{article.category}</p>
                </div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  {article.title}
                </h2>
                <p className="text-sm leading-7 text-on-surface-variant">{article.summary}</p>
                <div className="flex items-center justify-between">
                  <p className="font-label text-xs uppercase tracking-[0.16em] text-outline">
                    {formatPublishedDate(article.publishedAt)}
                  </p>
                  <Link
                    href={`/actualites/${article.slug}`}
                    className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                  >
                    Lire
                    <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-base font-semibold text-on-surface">
              Aucun article pour cette recherche
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Essayez un autre terme ou retirez le filtre de catégorie.
            </p>
          </div>
        )}
      </div>

      {/* Events */}
      {events.length > 0 && (
        <div>
          <div className="eyebrow mb-3">Événements à venir</div>
          <div className="space-y-4">
            {events.map((event) => (
              <article key={event.id} className="surface-card space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <CalendarRange aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  {event.title}
                </h2>
                <p className="text-sm leading-7 text-on-surface-variant">{event.description}</p>
                <p className="font-label text-xs uppercase tracking-[0.16em] text-outline">
                  {formatEventSchedule(event)}
                  {event.locationLabel ? ` · ${event.locationLabel}` : ""}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}

      {configured && (
        <div className="surface-section">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface">
                Contenus validés par l&apos;association
              </p>
              <a
                href="https://rosesein.org/"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
              >
                Voir le site institutionnel
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update actualites/page.tsx**

Replace the content rendering section of `app/actualites/page.tsx`. Keep the header section, replace everything from `<div className="surface-section">` onwards with:

```typescript
// app/actualites/page.tsx
// Change: remove revalidate, add limit increase, delegate rendering to NewsFilters

export const revalidate = 300;

export default async function NewsPage() {
  const { configured, articles, events } = await getPublicContentSnapshot();

  return (
    <AppShell title="Actualités" currentPath="/actualites">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Editorial et orientation</div>
          <h1 className="editorial-title">Des contenus clairs, fiables et sereins.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Retrouvez les articles et événements publiés par l&apos;association.
            Filtrez par catégorie ou recherchez un sujet.
          </p>
        </div>

        <NewsFilters articles={articles} events={events} configured={configured} />
      </section>
    </AppShell>
  );
}
```

Also add `import { NewsFilters } from "@/components/content/news-filters";` to the imports, and remove the old `ShieldCheck`, `ExternalLink`, `CalendarRange`, `Newspaper` icon imports (they are now inside `NewsFilters`). Keep `AppShell` and `getPublicContentSnapshot` imports.

Also update `getPublicContentSnapshot` in `lib/content.ts` to fetch up to 20 articles (change `.limit(6)` to `.limit(20)` in the articles query).

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/content/news-filters.tsx app/actualites/page.tsx lib/content.ts
git commit -m "feat(actualités): add category filter and search with NewsFilters client component"
```

---

## Task 14: Phase A — Association membership cards

**Files:**
- Modify: `app/association/page.tsx`

- [ ] **Step 1: Read current file fully**

Read `app/association/page.tsx` to understand the existing layout before making changes.

- [ ] **Step 2: Add membership/donation/volunteer section**

After the existing content in `app/association/page.tsx`, add before the closing `</section>` and `</AppShell>`:

```typescript
// Add this import at the top:
import { Gift, HeartHandshake, Users } from "lucide-react";

// Add this section at the bottom of the page, after existing content:
<section className="space-y-4">
  <div>
    <div className="eyebrow">Rejoindre la communauté</div>
    <h2 className="font-headline text-2xl font-bold text-on-surface">
      S&apos;engager avec ROSE-SEIN
    </h2>
  </div>

  <div className="grid gap-4 lg:grid-cols-3">
    <a
      href="https://rosesein.org/"
      target="_blank"
      rel="noreferrer"
      className="surface-card space-y-4 block"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HeartHandshake aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div>
        <h3 className="font-headline text-lg font-semibold text-on-surface">Adhérer</h3>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">
          Rejoignez l&apos;association et participez à ses actions.
        </p>
      </div>
      <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
        Adhérer sur rosesein.org
        <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
      </span>
    </a>

    <a
      href="https://rosesein.org/"
      target="_blank"
      rel="noreferrer"
      className="surface-card space-y-4 block"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <Gift aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div>
        <h3 className="font-headline text-lg font-semibold text-on-surface">Faire un don</h3>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">
          Soutenez les programmes d&apos;accompagnement et les ateliers.
        </p>
      </div>
      <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
        Faire un don
        <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
      </span>
    </a>

    <a
      href="https://rosesein.org/"
      target="_blank"
      rel="noreferrer"
      className="surface-card space-y-4 block"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div>
        <h3 className="font-headline text-lg font-semibold text-on-surface">Devenir bénévole</h3>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">
          Offrez votre temps et vos compétences pour accompagner les patientes.
        </p>
      </div>
      <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
        S&apos;inscrire
        <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
      </span>
    </a>
  </div>
</section>
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add app/association/page.tsx
git commit -m "feat(association): add membership, donation, and volunteer action cards"
```

---

## Task 15: Parcours mood check-in + bottom nav update

**Files:**
- Modify: `app/(protected)/parcours/actions.ts`
- Modify: `app/(protected)/parcours/page.tsx`
- Modify: `components/navigation/bottom-nav.tsx`

- [ ] **Step 1: Add saveMoodCheckIn to actions.ts**

Add this function at the end of `app/(protected)/parcours/actions.ts`:

```typescript
export async function saveMoodCheckIn(formData: FormData) {
  const mood = formData.get("mood");
  if (typeof mood !== "string" || !["1", "2", "3", "4", "5"].includes(mood)) {
    redirect("/parcours?error=mood-invalid");
  }

  const { user } = await requireCompletedProfile("/parcours");
  const supabase = await createSupabaseServerClient();

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const moodLabels: Record<string, string> = {
    "1": "Très difficile",
    "2": "Difficile",
    "3": "Correct",
    "4": "Bien",
    "5": "Très bien",
  };

  const { error } = await supabase.from("personal_notes").insert({
    user_id: user.id,
    title: `Humeur — ${today}`,
    body: `${moodLabels[mood as string]} (${mood}/5)`,
  });

  if (error) {
    redirect("/parcours?error=note-save-failed");
  }

  revalidatePath("/parcours");
  redirect(appendFeedback("/parcours", "status", "note-created"));
}
```

- [ ] **Step 2: Add mood check-in UI to parcours page**

In `app/(protected)/parcours/page.tsx`, add import:

```typescript
import { saveMoodCheckIn } from "./actions";
```

Add to `feedbackMap`:
```typescript
"mood-invalid": "Humeur non reconnue, veuillez réessayer.",
```

Insert this section after the feedback block and before the privacy section:

```typescript
<section className="surface-section space-y-4">
  <div>
    <p className="font-headline text-lg font-semibold text-on-surface">
      Comment vous sentez-vous aujourd&apos;hui ?
    </p>
    <p className="mt-1 text-sm leading-7 text-on-surface-variant">
      Un geste rapide pour noter votre humeur. Elle sera enregistrée dans vos notes.
    </p>
  </div>
  <form action={saveMoodCheckIn} className="flex gap-3">
    {[
      { value: "1", emoji: "😔", label: "Très difficile" },
      { value: "2", emoji: "😟", label: "Difficile" },
      { value: "3", emoji: "😐", label: "Correct" },
      { value: "4", emoji: "🙂", label: "Bien" },
      { value: "5", emoji: "😊", label: "Très bien" },
    ].map(({ value, emoji, label }) => (
      <button
        key={value}
        type="submit"
        name="mood"
        value={value}
        aria-label={label}
        title={label}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-2xl transition-transform hover:-translate-y-1 hover:bg-surface-container"
      >
        {emoji}
      </button>
    ))}
  </form>
</section>
```

- [ ] **Step 3: Update bottom nav — replace Actualités with Communauté**

Replace the full contents of `components/navigation/bottom-nav.tsx`:

```typescript
// components/navigation/bottom-nav.tsx
import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, HeartPulse, MessageCircleMore, Users } from "lucide-react";

const navItems = [
  {
    href: "/" as Route,
    label: "Accueil",
    icon: HeartPulse,
  },
  {
    href: "/communaute" as Route,
    label: "Communauté",
    icon: Users,
  },
  {
    href: "/messages" as Route,
    label: "Messages",
    icon: MessageCircleMore,
  },
  {
    href: "/parcours" as Route,
    label: "Parcours",
    icon: CalendarDays,
  },
];

type BottomNavProps = {
  currentPath: string;
};

export function BottomNav({ currentPath }: BottomNavProps) {
  const isActive = (href: string) =>
    currentPath === href || (href !== "/" && currentPath.startsWith(href));

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-screen-md px-4 pb-4"
    >
      <div className="glass-panel rounded-brand-xl flex items-center justify-around px-3 py-4 shadow-ambient">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex min-w-16 flex-col items-center gap-1 rounded-full px-4 py-2 text-center transition-transform duration-200 ${
              isActive(href)
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:-translate-y-0.5 hover:text-on-surface"
            }`}
          >
            <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            <span className="font-label text-[11px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Final build verification**

```bash
npm run build
```
Expected: build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add app/\(protected\)/parcours/ components/navigation/bottom-nav.tsx
git commit -m "feat(parcours): add mood check-in; feat(nav): replace Actualités with Communauté"
```

---

## Self-review notes

- All `ResourceCategory`, `ResourceFormat`, `ResourceDifficulty` type literals used in pages match what's defined in `lib/soins.ts`
- `CommunitySpace`, `CommunityThread`, `CommunityReply`, `SpaceWithThreads`, `ThreadWithReplies` in pages all reference types from `lib/communaute.ts`
- `AppNotification`, `NotificationSummary` in `NotificationBell` match `lib/notifications.ts`
- `markAllNotificationsRead` is a server action (file has `"use server"` directive) called from a form — correct pattern
- `postReply` action in `actions.ts` under the thread route — consistent with existing action pattern
- `saveMoodCheckIn` uses `appendFeedback` which is already defined in `actions.ts` — no new import needed
- `isActive` logic in `BottomNav` now uses prefix matching so `/communaute/patientes` highlights the Communauté tab
- `NotificationBell` uses `<details>/<summary>` — no client JS required, consistent with FAQ pattern in `/aide`
- Seed data community threads have a `do $$...$$` block that gracefully skips if no admin user exists
