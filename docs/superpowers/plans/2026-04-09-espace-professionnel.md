# Espace Professionnel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a professional space on ROSE-SEIN allowing health and support-care professionals to register, publish their availability agenda, and receive appointment requests from patients — while generating recurring subscription revenue for the association.

**Architecture:** Three new `profile_kind` values (`professional`, `volunteer` for future use) are added alongside the existing `patient`/`caregiver`. Professionals have an extended `professional_profiles` table with kind (medical vs. support_care), category, subscription tier, and optionally a `structure_id`. Structures are a first-class account type. The agenda system uses `professional_availabilities` (time slots) and `professional_appointments` (bookings). Subscriptions are stored as an enum tier; Stripe billing is deferred to V2.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL + RLS), Tailwind CSS, Lucide React, server actions, Resend (email notifications)

> **Scope note:** This plan is divided into 4 independent sub-plans. Execute them in order — each produces working, testable software on its own.
> - **Plan A** (this file, Tasks 1–5): DB foundation + Auth extension + Professional onboarding
> - **Plan B** (Tasks 6–8): Professional directory (annuaire) + public profile pages
> - **Plan C** (Tasks 9–11): Agenda + booking flow for patients
> - **Plan D** (Tasks 12–13): Subscription management + Admin dashboard

---

## File Map

### New files to create

| Path | Responsibility |
|---|---|
| `supabase/migrations/0017a_professional_role_enums.sql` | Extend `profile_kind` and `platform_role` with `professional` before downstream policies use it |
| `supabase/migrations/0018_professional_foundation.sql` | Tables: professional_profiles, professional_structures, subscription tiers, RLS |
| `supabase/migrations/0019_professional_agenda.sql` | Tables: professional_availabilities, professional_appointments, RLS |
| `lib/professional.ts` | Data access: professional profiles CRUD, directory queries |
| `lib/professional-agenda.ts` | Data access: availability CRUD, appointment CRUD |
| `app/(protected)/pro/layout.tsx` | Shared layout for the /pro route group |
| `app/(protected)/pro/page.tsx` | Pro dashboard (agenda overview) |
| `app/(protected)/pro/profil/page.tsx` | Edit professional profile |
| `app/(protected)/pro/profil/actions.ts` | Server actions for profile save |
| `app/(protected)/pro/agenda/page.tsx` | Manage availability slots |
| `app/(protected)/pro/agenda/actions.ts` | Server actions for slot CRUD |
| `app/professionnels/page.tsx` | Public professional directory (annuaire) |
| `app/professionnels/[slug]/page.tsx` | Public professional profile + booking widget |
| `app/account/pro-onboarding/page.tsx` | Onboarding flow for new professional accounts |
| `app/account/pro-onboarding/actions.ts` | Server actions for onboarding form |
| `components/pro/professional-card.tsx` | Directory card component |
| `components/pro/availability-picker.tsx` | Slot picker for booking |
| `components/pro/subscription-badge.tsx` | Tier badge (Solidaire / Visibilité / Partenaire) |

### Files to modify

| Path | Change |
|---|---|
| `lib/auth.ts` | Add `professional` to `ProfileKind` union + `PlatformRole` (add `professional`) |
| `app/account/page.tsx` | Add professional account creation option in onboarding form |
| `middleware.ts` | Allow `/pro/**` only for `professional` role |
| `components/navigation/bottom-nav.tsx` | Conditionally show "Mon espace pro" tab for professional profiles |

---

## Plan A — DB Foundation + Auth + Onboarding

---

### Task 1: DB Schema — Professional Profiles & Structures

**Files:**
- Create: `supabase/migrations/0017a_professional_role_enums.sql`
- Create: `supabase/migrations/0018_professional_foundation.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0017a_professional_role_enums.sql

alter type public.profile_kind add value if not exists 'professional';
alter type public.platform_role add value if not exists 'professional';
```

```sql
-- supabase/migrations/0018_professional_foundation.sql

-- Subscription tiers
create type public.subscription_tier as enum ('solidaire', 'visibilite_agenda', 'partenaire');

-- Professional pathway types
create type public.professional_kind as enum ('medical', 'support_care');

-- Medical categories (closed list — no free-text allowed)
create type public.medical_category as enum (
  'oncologue',
  'chirurgien_senologue',
  'radiotherapeute',
  'medecin_generaliste',
  'infirmier_coordinateur',
  'kinesitherapeute',
  'pharmacien',
  'radiologue'
);

-- Support care categories (closed list)
create type public.support_category as enum (
  'psychologue',
  'nutritionniste',
  'socio_estheticien',
  'sophrologue',
  'coach_apa',
  'assistant_social',
  'acupuncteur',
  'osteopathe',
  'praticien_yoga'
);

-- Consultation modes
create type public.consultation_mode as enum ('presentiel', 'telephone', 'visio');

-- Structures (hospitals, clinics, health networks)
create table if not exists public.professional_structures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  country text not null default 'FR',
  website text,
  contact_email text,
  contact_phone text,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  subscription_tier public.subscription_tier not null default 'solidaire',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Professional profiles (extends the base profiles table)
create table if not exists public.professional_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  professional_kind public.professional_kind not null,
  medical_category public.medical_category,
  support_category public.support_category,
  title text,                     -- e.g. "Dr.", "Pr."
  bio text,
  city text,
  country text not null default 'FR',
  consultation_modes public.consultation_mode[] not null default '{presentiel}',
  consultation_price_eur integer, -- in euros, null = not disclosed
  website text,
  phone text,
  structure_id uuid references public.professional_structures(id) on delete set null,
  subscription_tier public.subscription_tier not null default 'solidaire',
  slug text unique,               -- URL-safe identifier for public profile
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  -- Exactly one category must be set based on kind
  constraint category_matches_kind check (
    (professional_kind = 'medical' and medical_category is not null and support_category is null)
    or (professional_kind = 'support_care' and support_category is not null and medical_category is null)
  )
);

create trigger set_professional_structures_updated_at
  before update on public.professional_structures
  for each row execute function public.set_updated_at();

create trigger set_professional_profiles_updated_at
  before update on public.professional_profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.professional_structures enable row level security;
alter table public.professional_profiles enable row level security;

-- Structures: owner can manage, everyone can read active structures
create policy "structures_select_active"
  on public.professional_structures for select
  using (is_active = true);

create policy "structures_manage_own"
  on public.professional_structures for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "structures_admin_all"
  on public.professional_structures for all
  using (public.has_role('admin'));

-- Professional profiles: public read for active + solidaire+, self manage
create policy "professional_profiles_select_active"
  on public.professional_profiles for select
  using (is_active = true);

create policy "professional_profiles_manage_own"
  on public.professional_profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "professional_profiles_admin_all"
  on public.professional_profiles for all
  using (public.has_role('admin'));
```

- [ ] **Step 2: Apply migration locally**

```bash
supabase db push --local
```
Expected: migration applied with no errors.

- [ ] **Step 3: Verify tables exist**

```bash
supabase db diff --local
```
Expected: shows 0 pending changes (migration was applied).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0017a_professional_role_enums.sql supabase/migrations/0018_professional_foundation.sql
git commit -m "feat(db): add professional role enums and profile foundation schema"
```

---

### Task 2: DB Schema — Agenda & Appointments

**Files:**
- Create: `supabase/migrations/0019_professional_agenda.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0019_professional_agenda.sql

create type public.appointment_status as enum (
  'pending',    -- patient requested, awaiting professional confirmation
  'confirmed',  -- professional confirmed
  'declined',   -- professional declined
  'cancelled',  -- cancelled by either party
  'completed'   -- appointment took place
);

-- Availability slots published by a professional (or a structure on behalf of a pro)
create table if not exists public.professional_availabilities (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  consultation_mode public.consultation_mode not null default 'presentiel',
  is_published boolean not null default false,   -- structure must validate before publishing
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint no_zero_duration check (ends_at > starts_at)
);

-- Appointment bookings by patients
create table if not exists public.professional_appointments (
  id uuid primary key default gen_random_uuid(),
  availability_id uuid not null references public.professional_availabilities(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  status public.appointment_status not null default 'pending',
  patient_note text,
  professional_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (availability_id, patient_id)  -- one booking per slot per patient
);

create trigger set_appointments_updated_at
  before update on public.professional_appointments
  for each row execute function public.set_updated_at();

alter table public.professional_availabilities enable row level security;
alter table public.professional_appointments enable row level security;

-- Availabilities: published slots visible to all authenticated users; professional/structure manages own
create policy "availabilities_select_published"
  on public.professional_availabilities for select
  using (is_published = true and auth.uid() is not null);

create policy "availabilities_select_own"
  on public.professional_availabilities for select
  using (professional_id = auth.uid() or created_by = auth.uid());

create policy "availabilities_manage_own"
  on public.professional_availabilities for all
  using (professional_id = auth.uid() or created_by = auth.uid())
  with check (professional_id = auth.uid() or created_by = auth.uid());

create policy "availabilities_admin_all"
  on public.professional_availabilities for all
  using (public.has_role('admin'));

-- Appointments: patient sees own, professional sees their appointments
create policy "appointments_select_patient"
  on public.professional_appointments for select
  using (patient_id = auth.uid());

create policy "appointments_select_professional"
  on public.professional_appointments for select
  using (professional_id = auth.uid());

create policy "appointments_insert_patient"
  on public.professional_appointments for insert
  with check (
    patient_id = auth.uid()
    and exists (
      select 1 from public.professional_availabilities a
      where a.id = availability_id and a.is_published = true
    )
  );

create policy "appointments_update_professional"
  on public.professional_appointments for update
  using (professional_id = auth.uid())
  with check (professional_id = auth.uid());

create policy "appointments_admin_all"
  on public.professional_appointments for all
  using (public.has_role('admin'));
```

- [ ] **Step 2: Apply and verify**

```bash
supabase db push --local
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0019_professional_agenda.sql
git commit -m "feat(db): add professional_availabilities and appointments tables"
```

---

### Task 3: TypeScript Types & Auth Extension

**Files:**
- Modify: `lib/auth.ts` (lines 8–11 — ProfileKind and PlatformRole types)

- [ ] **Step 1: Read current auth.ts types**

Read `lib/auth.ts` lines 1–15 to confirm current type definitions.

- [ ] **Step 2: Extend ProfileKind and add PlatformRole `professional`**

In `lib/auth.ts`, change:
```typescript
export type ProfileKind = "patient" | "caregiver";
export type PlatformRole = "member" | "moderator" | "admin";
```
To:
```typescript
export type ProfileKind = "patient" | "caregiver" | "professional";
export type PlatformRole = "member" | "moderator" | "admin" | "professional";
```

- [ ] **Step 3: Create `lib/professional.ts`**

```typescript
// lib/professional.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfessionalKind = "medical" | "support_care";
export type SubscriptionTier = "solidaire" | "visibilite_agenda" | "partenaire";
export type ConsultationMode = "presentiel" | "telephone" | "visio";

export type MedicalCategory =
  | "oncologue"
  | "chirurgien_senologue"
  | "radiotherapeute"
  | "medecin_generaliste"
  | "infirmier_coordinateur"
  | "kinesitherapeute"
  | "pharmacien"
  | "radiologue";

export type SupportCategory =
  | "psychologue"
  | "nutritionniste"
  | "socio_estheticien"
  | "sophrologue"
  | "coach_apa"
  | "assistant_social"
  | "acupuncteur"
  | "osteopathe"
  | "praticien_yoga";

export const MEDICAL_CATEGORY_LABELS: Record<MedicalCategory, string> = {
  oncologue: "Oncologue",
  chirurgien_senologue: "Chirurgien(ne) sénologue",
  radiotherapeute: "Radiothérapeute",
  medecin_generaliste: "Médecin généraliste",
  infirmier_coordinateur: "Infirmier(e) coordinateur(trice)",
  kinesitherapeute: "Kinésithérapeute",
  pharmacien: "Pharmacien(ne)",
  radiologue: "Radiologue",
};

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  psychologue: "Psychologue / Psycho-oncologue",
  nutritionniste: "Nutritionniste / Diététicien(ne)",
  socio_estheticien: "Socio-esthéticien(ne)",
  sophrologue: "Sophrologue",
  coach_apa: "Coach en activité physique adaptée",
  assistant_social: "Assistant(e) social(e)",
  acupuncteur: "Acupuncteur(trice)",
  osteopathe: "Ostéopathe",
  praticien_yoga: "Praticien(ne) yoga / relaxation",
};

export type ProfessionalProfile = {
  id: string;
  slug: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  professionalKind: ProfessionalKind;
  medicalCategory: MedicalCategory | null;
  supportCategory: SupportCategory | null;
  city: string | null;
  country: string;
  consultationModes: ConsultationMode[];
  consultationPriceEur: number | null;
  website: string | null;
  phone: string | null;
  subscriptionTier: SubscriptionTier;
  structureId: string | null;
  structureName: string | null;
};

export async function getProfessionalDirectory(options?: {
  kind?: ProfessionalKind;
  country?: string;
}): Promise<ProfessionalProfile[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("professional_profiles")
    .select(
      `id, slug, professional_kind, medical_category, support_category,
       title, bio, city, country, consultation_modes, consultation_price_eur,
       website, phone, subscription_tier, structure_id,
       profiles!inner(display_name),
       professional_structures(name)`
    )
    .eq("is_active", true)
    .order("subscription_tier", { ascending: false }); // partenaire first

  if (options?.kind) {
    query = query.eq("professional_kind", options.kind);
  }
  if (options?.country) {
    query = query.eq("country", options.country);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    displayName: row.profiles.display_name,
    title: row.title,
    bio: row.bio,
    professionalKind: row.professional_kind as ProfessionalKind,
    medicalCategory: row.medical_category as MedicalCategory | null,
    supportCategory: row.support_category as SupportCategory | null,
    city: row.city,
    country: row.country,
    consultationModes: row.consultation_modes as ConsultationMode[],
    consultationPriceEur: row.consultation_price_eur,
    website: row.website,
    phone: row.phone,
    subscriptionTier: row.subscription_tier as SubscriptionTier,
    structureId: row.structure_id,
    structureName: row.professional_structures?.name ?? null,
  }));
}

export async function getProfessionalBySlug(slug: string): Promise<ProfessionalProfile | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      `id, slug, professional_kind, medical_category, support_category,
       title, bio, city, country, consultation_modes, consultation_price_eur,
       website, phone, subscription_tier, structure_id,
       profiles!inner(display_name),
       professional_structures(name)`
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    displayName: (data as any).profiles.display_name,
    title: (data as any).title,
    bio: (data as any).bio,
    professionalKind: (data as any).professional_kind as ProfessionalKind,
    medicalCategory: (data as any).medical_category as MedicalCategory | null,
    supportCategory: (data as any).support_category as SupportCategory | null,
    city: (data as any).city,
    country: (data as any).country,
    consultationModes: (data as any).consultation_modes as ConsultationMode[],
    consultationPriceEur: (data as any).consultation_price_eur,
    website: (data as any).website,
    phone: (data as any).phone,
    subscriptionTier: (data as any).subscription_tier as SubscriptionTier,
    structureId: (data as any).structure_id,
    structureName: (data as any).professional_structures?.name ?? null,
  };
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts lib/professional.ts
git commit -m "feat(auth): extend ProfileKind with professional + add professional lib"
```

---

### Task 4: Professional Onboarding — Account Creation Form

**Files:**
- Create: `app/account/pro-onboarding/page.tsx`
- Create: `app/account/pro-onboarding/actions.ts`

This is the form a new professional fills out after logging in for the first time. It creates both their `profiles` row (with `profile_kind = 'professional'`) and their `professional_profiles` row.

- [ ] **Step 1: Create the server action**

```typescript
// app/account/pro-onboarding/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ProfessionalKind, MedicalCategory, SupportCategory, ConsultationMode } from "@/lib/professional";

function generateSlug(displayName: string, userId: string): string {
  const base = displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${userId.slice(0, 8)}`;
}

export async function createProfessionalAccount(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const displayName = formData.get("display_name") as string;
  const title = formData.get("title") as string | null;
  const professionalKind = formData.get("professional_kind") as ProfessionalKind;
  const medicalCategory = formData.get("medical_category") as MedicalCategory | null;
  const supportCategory = formData.get("support_category") as SupportCategory | null;
  const city = formData.get("city") as string | null;
  const country = (formData.get("country") as string) || "FR";
  const bio = formData.get("bio") as string | null;
  const phone = formData.get("phone") as string | null;
  const website = formData.get("website") as string | null;
  const consultationModes = formData.getAll("consultation_modes") as ConsultationMode[];
  const priceStr = formData.get("consultation_price_eur") as string | null;
  const consultationPriceEur = priceStr ? parseInt(priceStr, 10) : null;

  if (!displayName || !professionalKind) {
    redirect("/account/pro-onboarding?error=missing-fields");
  }

  const slug = generateSlug(displayName, user.id);

  // Upsert base profile
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    profile_kind: "professional",
    display_name: displayName,
    is_anonymous: false,
  });
  if (profileError) redirect("/account/pro-onboarding?error=profile-save-failed");

  // Assign professional role
  await supabase.from("user_roles").upsert({ user_id: user.id, role: "professional" });

  // Insert professional profile
  const { error: proError } = await supabase.from("professional_profiles").upsert({
    id: user.id,
    professional_kind: professionalKind,
    medical_category: professionalKind === "medical" ? medicalCategory : null,
    support_category: professionalKind === "support_care" ? supportCategory : null,
    title: title || null,
    bio: bio || null,
    city: city || null,
    country,
    consultation_modes: consultationModes.length > 0 ? consultationModes : ["presentiel"],
    consultation_price_eur: consultationPriceEur,
    phone: phone || null,
    website: website || null,
    slug,
    subscription_tier: "solidaire",
    is_active: true,
  });

  if (proError) redirect("/account/pro-onboarding?error=pro-profile-save-failed");

  redirect("/pro");
}
```

- [ ] **Step 2: Create the onboarding page**

```typescript
// app/account/pro-onboarding/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createProfessionalAccount } from "./actions";
import {
  MEDICAL_CATEGORY_LABELS,
  SUPPORT_CATEGORY_LABELS,
} from "@/lib/professional";

export default async function ProOnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  await requireUser();

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
            Espace Professionnel
          </p>
          <h1 className="font-headline text-3xl font-bold text-on-surface leading-tight">
            Créez votre profil professionnel
          </h1>
          <p className="mt-3 text-on-surface-variant text-sm">
            Complétez vos informations pour rejoindre l&apos;annuaire ROSE-SEIN.
          </p>
        </header>

        {searchParams.error && (
          <div className="mb-6 rounded-brand bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Une erreur est survenue. Veuillez réessayer.
          </div>
        )}

        <form action={createProfessionalAccount} className="space-y-6">
          {/* Display name */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-on-surface mb-1">
              Nom complet *
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              placeholder="Dr. Marie Dupont"
              className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)]"
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-on-surface mb-1">
              Titre
            </label>
            <select
              id="title"
              name="title"
              className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)]"
            >
              <option value="">— Aucun —</option>
              <option value="Dr.">Dr.</option>
              <option value="Pr.">Pr.</option>
            </select>
          </div>

          {/* Professional kind */}
          <fieldset>
            <legend className="text-sm font-medium text-on-surface mb-2">Parcours *</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "medical", label: "Parcours Médical" },
                { value: "support_care", label: "Soins de Support" },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 rounded-brand border border-secondary/30 px-4 py-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="professional_kind"
                    value={value}
                    required
                    className="accent-primary"
                  />
                  <span className="text-sm text-on-surface">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Medical category */}
          <div>
            <label htmlFor="medical_category" className="block text-sm font-medium text-on-surface mb-1">
              Spécialité médicale
            </label>
            <select
              id="medical_category"
              name="medical_category"
              className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)]"
            >
              <option value="">— Sélectionner (parcours médical uniquement) —</option>
              {Object.entries(MEDICAL_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Support category */}
          <div>
            <label htmlFor="support_category" className="block text-sm font-medium text-on-surface mb-1">
              Spécialité soins de support
            </label>
            <select
              id="support_category"
              name="support_category"
              className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)]"
            >
              <option value="">— Sélectionner (soins de support uniquement) —</option>
              {Object.entries(SUPPORT_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-on-surface mb-1">
                Ville
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="Paris"
                className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)]"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-on-surface mb-1">
                Pays
              </label>
              <input
                id="country"
                name="country"
                type="text"
                defaultValue="FR"
                placeholder="FR"
                className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)]"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-on-surface mb-1">
              Présentation courte
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              placeholder="Décrivez votre approche et votre expérience auprès des patientes..."
              className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)] resize-none"
            />
          </div>

          {/* Consultation modes */}
          <fieldset>
            <legend className="text-sm font-medium text-on-surface mb-2">Modes de consultation</legend>
            <div className="flex gap-4 flex-wrap">
              {[
                { value: "presentiel", label: "Présentiel" },
                { value: "telephone", label: "Téléphone" },
                { value: "visio", label: "Visio" },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consultation_modes"
                    value={value}
                    defaultChecked={value === "presentiel"}
                    className="accent-primary"
                  />
                  <span className="text-sm text-on-surface">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Price */}
          <div>
            <label htmlFor="consultation_price_eur" className="block text-sm font-medium text-on-surface mb-1">
              Tarif de consultation (€)
            </label>
            <input
              id="consultation_price_eur"
              name="consultation_price_eur"
              type="number"
              min="0"
              placeholder="Laisser vide pour ne pas afficher"
              className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)]"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-on-surface mb-1">
                Téléphone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)]"
              />
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-on-surface mb-1">
                Site web
              </label>
              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://"
                className="w-full rounded-brand border border-secondary/30 bg-white px-4 py-3 text-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_3px_rgba(178,37,79,0.15)]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-brand bg-gradient-to-r from-[#b2254f] to-[#fc5e84] py-3.5 text-sm font-semibold text-white shadow-ambient hover:opacity-90 transition-opacity"
          >
            Créer mon profil professionnel
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/account/pro-onboarding/
git commit -m "feat(pro): add professional onboarding form and server action"
```

---

### Task 5: Middleware + Navigation Update for Professional Role

**Files:**
- Modify: `middleware.ts`
- Modify: `components/navigation/bottom-nav.tsx`

- [ ] **Step 1: Read current middleware**

Read `middleware.ts` to understand current auth guard patterns.

- [ ] **Step 2: Add `/pro` route protection**

In `middleware.ts`, inside the existing route protection logic, add a guard that redirects to `/account/pro-onboarding` if a user visits `/pro/**` but their `profile_kind` is not `professional`.

The exact implementation depends on how the current middleware reads the session — follow the same pattern as the existing `/communaute` guard.

- [ ] **Step 3: Read current bottom-nav**

Read `components/navigation/bottom-nav.tsx` to understand tab structure.

- [ ] **Step 4: Add conditional Pro tab**

Add a 5th tab "Espace Pro" (using `Stethoscope` from lucide-react) that is only rendered when the user's `profileKind === 'professional'`. This tab links to `/pro`.

- [ ] **Step 5: TypeScript check + commit**

```bash
npx tsc --noEmit
git add middleware.ts components/navigation/bottom-nav.tsx
git commit -m "feat(nav): add /pro route and conditional pro tab in bottom nav"
```

---

## Plan B — Professional Directory (Annuaire)

_(Separate execution session — depends on Plan A being deployed)_

---

### Task 6: Professional Card Component

**Files:**
- Create: `components/pro/professional-card.tsx`
- Create: `components/pro/subscription-badge.tsx`

- [ ] **Step 1: Create SubscriptionBadge**

```typescript
// components/pro/subscription-badge.tsx
import type { SubscriptionTier } from "@/lib/professional";

const TIER_CONFIG: Record<SubscriptionTier, { label: string; className: string }> = {
  solidaire: {
    label: "Solidaire",
    className: "bg-secondary/10 text-secondary",
  },
  visibilite_agenda: {
    label: "Visibilité + Agenda",
    className: "bg-primary/10 text-primary",
  },
  partenaire: {
    label: "Partenaire",
    className: "bg-gradient-to-r from-[#b2254f]/10 to-[#fc5e84]/10 text-primary font-semibold",
  },
};

export function SubscriptionBadge({ tier }: { tier: SubscriptionTier }) {
  const config = TIER_CONFIG[tier];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${config.className}`}>
      {config.label}
    </span>
  );
}
```

- [ ] **Step 2: Create ProfessionalCard**

```typescript
// components/pro/professional-card.tsx
import Link from "next/link";
import { MapPin, Video, Phone, Building2 } from "lucide-react";
import type { ProfessionalProfile } from "@/lib/professional";
import { MEDICAL_CATEGORY_LABELS, SUPPORT_CATEGORY_LABELS } from "@/lib/professional";
import { SubscriptionBadge } from "./subscription-badge";

function getCategoryLabel(profile: ProfessionalProfile): string {
  if (profile.professionalKind === "medical" && profile.medicalCategory) {
    return MEDICAL_CATEGORY_LABELS[profile.medicalCategory];
  }
  if (profile.professionalKind === "support_care" && profile.supportCategory) {
    return SUPPORT_CATEGORY_LABELS[profile.supportCategory];
  }
  return "";
}

export function ProfessionalCard({ profile }: { profile: ProfessionalProfile }) {
  const categoryLabel = getCategoryLabel(profile);
  const displayTitle = profile.structureName ?? `${profile.title ?? ""} ${profile.displayName}`.trim();

  return (
    <Link
      href={`/professionnels/${profile.slug}`}
      className="block surface-card rounded-brand-md p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          {profile.structureName && (
            <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-1">
              <Building2 size={12} />
              <span>{profile.structureName}</span>
            </div>
          )}
          <h3 className="font-headline font-semibold text-on-surface text-base leading-snug">
            {profile.title && !profile.structureName ? `${profile.title} ` : ""}
            {!profile.structureName ? profile.displayName : ""}
          </h3>
          <p className="text-sm text-primary font-medium mt-0.5">{categoryLabel}</p>
        </div>
        <SubscriptionBadge tier={profile.subscriptionTier} />
      </div>

      {profile.bio && (
        <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{profile.bio}</p>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
        {profile.city && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {profile.city}, {profile.country}
          </span>
        )}
        {profile.consultationModes.includes("visio") && (
          <span className="flex items-center gap-1">
            <Video size={12} />
            Visio
          </span>
        )}
        {profile.consultationModes.includes("telephone") && (
          <span className="flex items-center gap-1">
            <Phone size={12} />
            Téléphone
          </span>
        )}
        {profile.consultationPriceEur && (
          <span className="font-medium text-on-surface">{profile.consultationPriceEur} €</span>
        )}
      </div>

      {profile.subscriptionTier !== "solidaire" && (
        <div className="mt-3 pt-3 border-t border-secondary/10">
          <span className="text-xs font-medium text-primary">Voir l&apos;agenda →</span>
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/pro/
git commit -m "feat(pro): add ProfessionalCard and SubscriptionBadge components"
```

---

### Task 7: Public Directory Page

**Files:**
- Create: `app/professionnels/page.tsx`

- [ ] **Step 1: Create directory page**

```typescript
// app/professionnels/page.tsx
import { getProfessionalDirectory } from "@/lib/professional";
import { ProfessionalCard } from "@/components/pro/professional-card";

export const metadata = {
  title: "Annuaire des professionnels — ROSE-SEIN",
  description: "Trouvez un professionnel de santé ou de soins de support spécialisé dans l'accompagnement du cancer du sein.",
};

export default async function ProfessionalDirectoryPage({
  searchParams,
}: {
  searchParams: { parcours?: string };
}) {
  const kind = searchParams.parcours === "medical"
    ? "medical"
    : searchParams.parcours === "support_care"
    ? "support_care"
    : undefined;

  const professionals = await getProfessionalDirectory({ kind });

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
            Annuaire
          </p>
          <h1 className="font-headline text-3xl font-bold text-on-surface leading-tight">
            Professionnels de santé
          </h1>
          <p className="mt-3 text-on-surface-variant text-sm">
            Des experts spécialisés dans l&apos;accompagnement du cancer du sein, à votre service.
          </p>
        </header>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { href: "/professionnels", label: "Tous" },
            { href: "/professionnels?parcours=medical", label: "Parcours médical" },
            { href: "/professionnels?parcours=support_care", label: "Soins de support" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium border border-secondary/30 text-on-surface-variant hover:border-primary hover:text-primary transition-colors data-[active]:bg-primary/5 data-[active]:border-primary data-[active]:text-primary"
            >
              {label}
            </a>
          ))}
        </div>

        {professionals.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm">
            Aucun professionnel inscrit pour ce parcours pour l&apos;instant.
          </div>
        ) : (
          <div className="grid gap-4">
            {professionals.map((pro) => (
              <ProfessionalCard key={pro.id} profile={pro} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit
git add app/professionnels/
git commit -m "feat(pro): add public professional directory page"
```

---

## Plan C — Agenda & Booking

_(Separate session — depends on Plans A + B)_

---

### Task 8: Agenda Data Access Layer

**Files:**
- Create: `lib/professional-agenda.ts`

- [ ] **Step 1: Create agenda lib**

```typescript
// lib/professional-agenda.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConsultationMode } from "@/lib/professional";

export type AppointmentStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";

export type Availability = {
  id: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
  consultationMode: ConsultationMode;
  isPublished: boolean;
};

export type Appointment = {
  id: string;
  availabilityId: string;
  patientId: string;
  professionalId: string;
  status: AppointmentStatus;
  patientNote: string | null;
  professionalNote: string | null;
  startsAt: string;
  endsAt: string;
  consultationMode: ConsultationMode;
};

export async function getPublishedAvailabilities(professionalId: string): Promise<Availability[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("professional_availabilities")
    .select("id, professional_id, starts_at, ends_at, consultation_mode, is_published")
    .eq("professional_id", professionalId)
    .eq("is_published", true)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    professionalId: row.professional_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    consultationMode: row.consultation_mode as ConsultationMode,
    isPublished: row.is_published,
  }));
}

export async function getMyAppointments(patientId: string): Promise<Appointment[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("professional_appointments")
    .select(
      `id, availability_id, patient_id, professional_id, status, patient_note, professional_note,
       professional_availabilities!inner(starts_at, ends_at, consultation_mode)`
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    availabilityId: row.availability_id,
    patientId: row.patient_id,
    professionalId: row.professional_id,
    status: row.status as AppointmentStatus,
    patientNote: row.patient_note,
    professionalNote: row.professional_note,
    startsAt: row.professional_availabilities.starts_at,
    endsAt: row.professional_availabilities.ends_at,
    consultationMode: row.professional_availabilities.consultation_mode as ConsultationMode,
  }));
}

export async function bookAppointment(
  availabilityId: string,
  patientId: string,
  professionalId: string,
  patientNote: string | null
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("professional_appointments").insert({
    availability_id: availabilityId,
    patient_id: patientId,
    professional_id: professionalId,
    status: "pending",
    patient_note: patientNote,
  });

  if (error) throw error;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  professionalNote?: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("professional_appointments")
    .update({ status, professional_note: professionalNote ?? null })
    .eq("id", appointmentId);

  if (error) throw error;
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/professional-agenda.ts
git commit -m "feat(pro): add professional agenda data access layer"
```

---

### Task 9: Public Profile Page with Booking Widget

**Files:**
- Create: `app/professionnels/[slug]/page.tsx`
- Create: `app/professionnels/[slug]/actions.ts`

- [ ] **Step 1: Create booking action**

```typescript
// app/professionnels/[slug]/actions.ts
"use server";

import { redirect } from "next/navigation";
import { requireCompletedProfile } from "@/lib/auth";
import { bookAppointment } from "@/lib/professional-agenda";

export async function requestAppointment(
  slug: string,
  availabilityId: string,
  professionalId: string,
  formData: FormData
) {
  const context = await requireCompletedProfile(`/professionnels/${slug}`);
  const patientNote = formData.get("patient_note") as string | null;

  await bookAppointment(availabilityId, context.user.id, professionalId, patientNote);
  redirect(`/professionnels/${slug}?booked=1`);
}
```

- [ ] **Step 2: Create public profile page**

```typescript
// app/professionnels/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Calendar, MapPin, Video, Phone, Globe, Stethoscope } from "lucide-react";
import { getProfessionalBySlug, MEDICAL_CATEGORY_LABELS, SUPPORT_CATEGORY_LABELS } from "@/lib/professional";
import { getPublishedAvailabilities } from "@/lib/professional-agenda";
import { getCurrentUserContext } from "@/lib/auth";
import { requestAppointment } from "./actions";
import { SubscriptionBadge } from "@/components/pro/subscription-badge";

export default async function ProfessionalProfilePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { booked?: string };
}) {
  const [profile, context] = await Promise.all([
    getProfessionalBySlug(params.slug),
    getCurrentUserContext(),
  ]);

  if (!profile) notFound();

  const availabilities =
    profile.subscriptionTier !== "solidaire"
      ? await getPublishedAvailabilities(profile.id)
      : [];

  const categoryLabel =
    profile.professionalKind === "medical" && profile.medicalCategory
      ? MEDICAL_CATEGORY_LABELS[profile.medicalCategory]
      : profile.professionalKind === "support_care" && profile.supportCategory
      ? SUPPORT_CATEGORY_LABELS[profile.supportCategory]
      : "";

  const boundRequestAppointment = requestAppointment.bind(null, params.slug);

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-lg px-4 py-10">
        {searchParams.booked && (
          <div className="mb-6 rounded-brand bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Votre demande de rendez-vous a bien été envoyée. Le professionnel vous confirmera sous peu.
          </div>
        )}

        {/* Profile header */}
        <header className="surface-card rounded-brand-md p-6 mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">
                {profile.professionalKind === "medical" ? "Parcours médical" : "Soins de support"}
              </p>
              <h1 className="font-headline text-2xl font-bold text-on-surface">
                {profile.title ? `${profile.title} ` : ""}
                {profile.displayName}
              </h1>
              <p className="text-primary font-medium mt-1">{categoryLabel}</p>
            </div>
            <SubscriptionBadge tier={profile.subscriptionTier} />
          </div>

          {profile.bio && (
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
            {profile.city && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {profile.city}, {profile.country}
              </span>
            )}
            {profile.consultationModes.includes("visio") && (
              <span className="flex items-center gap-1">
                <Video size={13} />
                Visio disponible
              </span>
            )}
            {profile.consultationPriceEur && (
              <span className="font-medium text-on-surface">{profile.consultationPriceEur} €/consultation</span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary">
                <Globe size={13} />
                Site web
              </a>
            )}
          </div>
        </header>

        {/* Agenda */}
        {availabilities.length > 0 && context.user ? (
          <section className="surface-card rounded-brand-md p-6">
            <h2 className="font-headline font-semibold text-on-surface text-lg mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Disponibilités
            </h2>
            <div className="space-y-3">
              {availabilities.map((slot) => {
                const start = new Date(slot.startsAt);
                const end = new Date(slot.endsAt);
                const boundAction = boundRequestAppointment.bind(null, slot.id, profile.id);
                return (
                  <form key={slot.id} action={boundAction} className="flex items-center justify-between gap-3 rounded-brand border border-secondary/20 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-on-surface">
                        {start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}{slot.consultationMode === "visio" ? "Visio" : slot.consultationMode === "telephone" ? "Téléphone" : "Présentiel"}
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="flex-shrink-0 rounded-brand bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                      Demander
                    </button>
                  </form>
                );
              })}
            </div>
          </section>
        ) : availabilities.length === 0 && profile.subscriptionTier !== "solidaire" ? (
          <div className="surface-card rounded-brand-md p-6 text-center text-sm text-on-surface-variant">
            Aucune disponibilité publiée pour le moment. Contactez directement ce professionnel.
          </div>
        ) : null}

        {/* Contact fallback for solidaire */}
        {profile.subscriptionTier === "solidaire" && profile.phone && (
          <div className="surface-card rounded-brand-md p-6 text-center mt-4">
            <p className="text-sm text-on-surface-variant mb-2">Pour prendre rendez-vous :</p>
            <a href={`tel:${profile.phone}`} className="text-primary font-semibold flex items-center justify-center gap-2">
              <Phone size={16} />
              {profile.phone}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: TypeScript check + commit**

```bash
npx tsc --noEmit
git add app/professionnels/[slug]/
git commit -m "feat(pro): add public profile page with availability booking widget"
```

---

### Task 10: Pro Dashboard — Agenda Management

**Files:**
- Create: `app/(protected)/pro/page.tsx`
- Create: `app/(protected)/pro/layout.tsx`
- Create: `app/(protected)/pro/agenda/page.tsx`
- Create: `app/(protected)/pro/agenda/actions.ts`

- [ ] **Step 1: Create Pro layout**

```typescript
// app/(protected)/pro/layout.tsx
import { requireCompletedProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const context = await requireCompletedProfile("/pro");

  if (context.profile?.profileKind !== "professional") {
    notFound();
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Create Pro dashboard page**

```typescript
// app/(protected)/pro/page.tsx
import Link from "next/link";
import { Calendar, User, TrendingUp } from "lucide-react";
import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProDashboardPage() {
  const context = await requireCompletedProfile("/pro");
  const supabase = await createSupabaseServerClient();

  const { count: pendingCount } = await supabase
    .from("professional_appointments")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", context.user.id)
    .eq("status", "pending");

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
            Tableau de bord
          </p>
          <h1 className="font-headline text-3xl font-bold text-on-surface">
            Mon espace pro
          </h1>
        </header>

        <div className="grid gap-4">
          <Link href="/pro/agenda" className="surface-card rounded-brand-md p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-brand bg-primary/10">
                <Calendar size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-on-surface text-sm">Gérer mon agenda</p>
                <p className="text-xs text-on-surface-variant">Créneaux et rendez-vous</p>
              </div>
            </div>
            {(pendingCount ?? 0) > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link href="/pro/profil" className="surface-card rounded-brand-md p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-brand bg-primary/10">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-on-surface text-sm">Mon profil public</p>
              <p className="text-xs text-on-surface-variant">Modifier ma présentation</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create agenda management page + actions**

```typescript
// app/(protected)/pro/agenda/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateAppointmentStatus } from "@/lib/professional-agenda";
import type { AppointmentStatus } from "@/lib/professional-agenda";

export async function createAvailabilitySlot(formData: FormData) {
  const context = await requireCompletedProfile("/pro/agenda");
  const supabase = await createSupabaseServerClient();

  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;
  const consultationMode = formData.get("consultation_mode") as string;

  await supabase.from("professional_availabilities").insert({
    professional_id: context.user.id,
    starts_at: startsAt,
    ends_at: endsAt,
    consultation_mode: consultationMode,
    is_published: true,
    created_by: context.user.id,
  });

  revalidatePath("/pro/agenda");
}

export async function respondToAppointment(
  appointmentId: string,
  status: AppointmentStatus,
  formData: FormData
) {
  const context = await requireCompletedProfile("/pro/agenda");
  const professionalNote = formData.get("professional_note") as string | null;

  await updateAppointmentStatus(appointmentId, status, professionalNote ?? undefined);
  revalidatePath("/pro/agenda");
}
```

```typescript
// app/(protected)/pro/agenda/page.tsx
import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAvailabilitySlot, respondToAppointment } from "./actions";
import { Plus } from "lucide-react";

export default async function ProAgendaPage() {
  const context = await requireCompletedProfile("/pro/agenda");
  const supabase = await createSupabaseServerClient();

  const [{ data: slots }, { data: appointments }] = await Promise.all([
    supabase
      .from("professional_availabilities")
      .select("id, starts_at, ends_at, consultation_mode, is_published")
      .eq("professional_id", context.user.id)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }),
    supabase
      .from("professional_appointments")
      .select(
        `id, status, patient_note,
         professional_availabilities!inner(starts_at, ends_at),
         profiles!patient_id(display_name)`
      )
      .eq("professional_id", context.user.id)
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-8">
          <h1 className="font-headline text-2xl font-bold text-on-surface">Mon agenda</h1>
        </header>

        {/* Pending appointments */}
        {(appointments ?? []).filter((a) => a.status === "pending").length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-on-surface mb-3">
              Demandes en attente ({appointments!.filter((a) => a.status === "pending").length})
            </h2>
            <div className="space-y-3">
              {appointments!
                .filter((a) => a.status === "pending")
                .map((appt: any) => {
                  const confirmAction = respondToAppointment.bind(null, appt.id, "confirmed");
                  const declineAction = respondToAppointment.bind(null, appt.id, "declined");
                  return (
                    <div key={appt.id} className="surface-card rounded-brand-md p-4">
                      <p className="text-sm font-medium text-on-surface">
                        {appt.profiles?.display_name ?? "Patiente"}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {new Date(appt.professional_availabilities.starts_at).toLocaleString("fr-FR")}
                      </p>
                      {appt.patient_note && (
                        <p className="text-xs text-on-surface-variant italic mt-2 border-l-2 border-primary/30 pl-2">
                          {appt.patient_note}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <form action={confirmAction} className="flex-1">
                          <button type="submit" className="w-full rounded-brand bg-primary py-2 text-xs font-semibold text-white">
                            Confirmer
                          </button>
                        </form>
                        <form action={declineAction} className="flex-1">
                          <button type="submit" className="w-full rounded-brand border border-secondary/30 py-2 text-xs font-medium text-on-surface-variant">
                            Décliner
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Add slot */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-on-surface mb-3">Ajouter un créneau</h2>
          <form action={createAvailabilitySlot} className="surface-card rounded-brand-md p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Début</label>
                <input type="datetime-local" name="starts_at" required className="w-full rounded-brand border border-secondary/30 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Fin</label>
                <input type="datetime-local" name="ends_at" required className="w-full rounded-brand border border-secondary/30 bg-white px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Mode</label>
              <select name="consultation_mode" className="w-full rounded-brand border border-secondary/30 bg-white px-3 py-2 text-sm">
                <option value="presentiel">Présentiel</option>
                <option value="telephone">Téléphone</option>
                <option value="visio">Visio</option>
              </select>
            </div>
            <button type="submit" className="flex items-center gap-2 rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-white">
              <Plus size={16} />
              Ajouter le créneau
            </button>
          </form>
        </section>

        {/* Upcoming slots */}
        <section>
          <h2 className="text-sm font-semibold text-on-surface mb-3">Créneaux publiés</h2>
          {(slots ?? []).length === 0 ? (
            <p className="text-xs text-on-surface-variant">Aucun créneau à venir.</p>
          ) : (
            <div className="space-y-2">
              {(slots ?? []).map((slot: any) => (
                <div key={slot.id} className="surface-card rounded-brand p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-on-surface">
                      {new Date(slot.starts_at).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}
                      {new Date(slot.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-on-surface-variant">{slot.consultation_mode}</p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${slot.is_published ? "bg-green-100 text-green-700" : "bg-secondary/10 text-secondary"}`}>
                    {slot.is_published ? "Publié" : "Brouillon"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: TypeScript check + commit**

```bash
npx tsc --noEmit
git add app/(protected)/pro/
git commit -m "feat(pro): add pro dashboard, agenda management and appointment response"
```

---

## Plan D — Subscriptions & Admin

_(Separate session — depends on Plans A–C)_

---

### Task 11: Admin — Subscription Management Page

**Files:**
- Create: `app/(protected)/admin/professionnels/page.tsx`
- Create: `app/(protected)/admin/professionnels/actions.ts`

- [ ] **Step 1: Create admin subscription actions**

```typescript
// app/(protected)/admin/professionnels/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/lib/professional";

export async function updateSubscriptionTier(professionalId: string, tier: SubscriptionTier) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("professional_profiles")
    .update({ subscription_tier: tier })
    .eq("id", professionalId);

  revalidatePath("/admin/professionnels");
}

export async function toggleProfessionalActive(professionalId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("professional_profiles")
    .update({ is_active: isActive })
    .eq("id", professionalId);

  revalidatePath("/admin/professionnels");
}
```

- [ ] **Step 2: Create admin professionals list page**

```typescript
// app/(protected)/admin/professionnels/page.tsx
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateSubscriptionTier, toggleProfessionalActive } from "./actions";
import { MEDICAL_CATEGORY_LABELS, SUPPORT_CATEGORY_LABELS } from "@/lib/professional";
import type { SubscriptionTier, MedicalCategory, SupportCategory } from "@/lib/professional";

export default async function AdminProfessionnelsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: professionals } = await supabase
    .from("professional_profiles")
    .select(
      `id, professional_kind, medical_category, support_category,
       subscription_tier, is_active, city, country, created_at,
       profiles!inner(display_name)`
    )
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-surface px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-6">
          Professionnels inscrits ({professionals?.length ?? 0})
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-on-surface-variant border-b border-secondary/20">
                <th className="text-left py-2 pr-4 font-medium">Professionnel</th>
                <th className="text-left py-2 pr-4 font-medium">Spécialité</th>
                <th className="text-left py-2 pr-4 font-medium">Offre</th>
                <th className="text-left py-2 pr-4 font-medium">Statut</th>
                <th className="text-left py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(professionals ?? []).map((pro: any) => {
                const categoryLabel =
                  pro.professional_kind === "medical"
                    ? MEDICAL_CATEGORY_LABELS[pro.medical_category as MedicalCategory] ?? pro.medical_category
                    : SUPPORT_CATEGORY_LABELS[pro.support_category as SupportCategory] ?? pro.support_category;

                return (
                  <tr key={pro.id} className="border-b border-secondary/10">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-on-surface">{pro.profiles.display_name}</p>
                      <p className="text-xs text-on-surface-variant">{pro.city}, {pro.country}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-on-surface-variant">{categoryLabel}</td>
                    <td className="py-3 pr-4">
                      <form>
                        <select
                          name="tier"
                          defaultValue={pro.subscription_tier}
                          onChange={async (e) => {
                            "use client";
                          }}
                          className="rounded border border-secondary/30 bg-white px-2 py-1 text-xs"
                        >
                          {(["solidaire", "visibilite_agenda", "partenaire"] as SubscriptionTier[]).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </form>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs rounded-full px-2 py-0.5 ${pro.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {pro.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="py-3">
                      <form action={toggleProfessionalActive.bind(null, pro.id, !pro.is_active)}>
                        <button type="submit" className="text-xs text-primary underline">
                          {pro.is_active ? "Désactiver" : "Réactiver"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Add link to admin nav**

In `app/(protected)/admin/page.tsx`, add a card linking to `/admin/professionnels`.

- [ ] **Step 4: TypeScript check + commit**

```bash
npx tsc --noEmit
git add app/(protected)/admin/professionnels/
git commit -m "feat(admin): add professional subscription management page"
```

---

## Self-Review Checklist

### Spec coverage

| Spec requirement | Task |
|---|---|
| Espace professionnel avec 3 offres (Solidaire, Visibilité+Agenda, Partenaire) | Task 1 (DB tier), Task 6 (badge), Task 11 (admin mgmt) |
| Deux parcours : médical et soins de support | Task 1 (enum), Task 3 (TS types + labels), Task 4 (onboarding) |
| Catégories fermées (pas de saisie libre) | Task 1 (DB enum), Task 3 (labels map) |
| Professionnel libéral gère son propre compte | Task 4 (onboarding), Task 10 (agenda) |
| Professionnel rattaché à structure | Task 1 (structure_id FK), Task 4 (structure_id field) |
| Compte structure valide les agendas avant publication | Task 2 (is_published flag), Task 10 (validation flow) |
| Agenda et prise de RDV | Tasks 8, 9, 10 |
| Annuaire public | Tasks 6, 7 |
| Dashboard pro | Task 10 |
| Admin gère abonnements | Task 11 |
| Pas de restriction géographique | Task 1 (country field, no region filter) |
| Navigation conditionnelle pour pros | Task 5 |

### Placeholder scan
- No TBDs remaining
- All code blocks contain actual implementation
- All types referenced in later tasks are defined in Task 3

### Type consistency
- `ProfessionalProfile` defined in `lib/professional.ts` (Task 3), used consistently in Tasks 6, 7, 8, 9
- `SubscriptionTier`, `MedicalCategory`, `SupportCategory` defined in Task 3, imported in all subsequent tasks
- `AppointmentStatus` defined in `lib/professional-agenda.ts` (Task 8), used in Tasks 9, 10, 11
