do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'subscription_tier'
  ) then
    create type public.subscription_tier as enum ('solidaire', 'visibilite_agenda', 'partenaire');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'professional_kind'
  ) then
    create type public.professional_kind as enum ('medical', 'support_care');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'medical_category'
  ) then
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
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'support_category'
  ) then
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
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'consultation_mode'
  ) then
    create type public.consultation_mode as enum ('presentiel', 'telephone', 'visio');
  end if;
end
$$;

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

create table if not exists public.professional_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  professional_kind public.professional_kind not null,
  medical_category public.medical_category,
  support_category public.support_category,
  title text,
  bio text,
  city text,
  country text not null default 'FR',
  consultation_modes public.consultation_mode[] not null default array['presentiel'::public.consultation_mode],
  consultation_price_eur integer,
  website text,
  phone text,
  structure_id uuid references public.professional_structures(id) on delete set null,
  subscription_tier public.subscription_tier not null default 'solidaire',
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint professional_category_matches_kind check (
    (
      professional_kind = 'medical'
      and medical_category is not null
      and support_category is null
    )
    or (
      professional_kind = 'support_care'
      and support_category is not null
      and medical_category is null
    )
  ),
  constraint professional_consultation_price_non_negative check (
    consultation_price_eur is null or consultation_price_eur >= 0
  )
);

create index if not exists professional_profiles_kind_idx
  on public.professional_profiles (professional_kind);

create index if not exists professional_profiles_subscription_tier_idx
  on public.professional_profiles (subscription_tier desc, created_at desc);

create index if not exists professional_profiles_structure_id_idx
  on public.professional_profiles (structure_id);

drop trigger if exists set_professional_structures_updated_at on public.professional_structures;
create trigger set_professional_structures_updated_at
before update on public.professional_structures
for each row
execute function public.set_updated_at();

drop trigger if exists set_professional_profiles_updated_at on public.professional_profiles;
create trigger set_professional_profiles_updated_at
before update on public.professional_profiles
for each row
execute function public.set_updated_at();

alter table public.professional_structures enable row level security;
alter table public.professional_profiles enable row level security;

drop policy if exists "roles_insert_professional_self" on public.user_roles;
create policy "roles_insert_professional_self"
on public.user_roles
for insert
with check (
  auth.uid() = user_id
  and role = 'professional'
);

drop policy if exists "profiles_select_public_professionals" on public.profiles;
create policy "profiles_select_public_professionals"
on public.profiles
for select
using (
  exists (
    select 1
    from public.professional_profiles professional
    where professional.id = profiles.id
      and professional.is_active = true
  )
);

drop policy if exists "structures_select_active" on public.professional_structures;
create policy "structures_select_active"
on public.professional_structures
for select
using (is_active = true);

drop policy if exists "structures_manage_own" on public.professional_structures;
create policy "structures_manage_own"
on public.professional_structures
for all
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "structures_admin_all" on public.professional_structures;
create policy "structures_admin_all"
on public.professional_structures
for all
using (public.has_role('admin'));

drop policy if exists "professional_profiles_select_active" on public.professional_profiles;
create policy "professional_profiles_select_active"
on public.professional_profiles
for select
using (is_active = true);

drop policy if exists "professional_profiles_manage_own" on public.professional_profiles;
create policy "professional_profiles_manage_own"
on public.professional_profiles
for all
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "professional_profiles_admin_all" on public.professional_profiles;
create policy "professional_profiles_admin_all"
on public.professional_profiles
for all
using (public.has_role('admin'));
