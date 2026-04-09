import "server-only";

import { hasSupabaseBrowserEnv } from "@/lib/env";
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

export type ProfessionalCategory = MedicalCategory | SupportCategory;

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
  structureId: string | null;
  structureName: string | null;
  subscriptionTier: SubscriptionTier;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminManagedProfessional = ProfessionalProfile & {
  categoryLabel: string;
};

type ProfessionalRow = {
  id: string;
  slug: string;
  professional_kind: ProfessionalKind;
  medical_category: MedicalCategory | null;
  support_category: SupportCategory | null;
  title: string | null;
  bio: string | null;
  city: string | null;
  country: string;
  consultation_modes: ConsultationMode[] | null;
  consultation_price_eur: number | null;
  website: string | null;
  phone: string | null;
  structure_id: string | null;
  subscription_tier: SubscriptionTier;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { display_name?: string | null } | Array<{ display_name?: string | null }> | null;
  professional_structures?:
    | { name?: string | null }
    | Array<{ name?: string | null }>
    | null;
};

export const MEDICAL_CATEGORY_LABELS: Record<MedicalCategory, string> = {
  oncologue: "Oncologue",
  chirurgien_senologue: "Chirurgien(ne) sénologue",
  radiotherapeute: "Radiothérapeute",
  medecin_generaliste: "Médecin généraliste référent cancer",
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

export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  solidaire: "Solidaire",
  visibilite_agenda: "Visibilité + agenda",
  partenaire: "Partenaire",
};

export const CONSULTATION_MODE_LABELS: Record<ConsultationMode, string> = {
  presentiel: "Présentiel",
  telephone: "Téléphone",
  visio: "Visio",
};

function getRelationObject<T extends object>(
  relation: T | T[] | null | undefined,
): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function mapProfessionalRow(row: ProfessionalRow): ProfessionalProfile {
  const profileRelation = getRelationObject(row.profiles);
  const structureRelation = getRelationObject(row.professional_structures);

  return {
    id: row.id,
    slug: row.slug,
    displayName: profileRelation?.display_name ?? "Professionnel ROSE-SEIN",
    title: row.title,
    bio: row.bio,
    professionalKind: row.professional_kind,
    medicalCategory: row.medical_category,
    supportCategory: row.support_category,
    city: row.city,
    country: row.country,
    consultationModes: row.consultation_modes ?? ["presentiel"],
    consultationPriceEur: row.consultation_price_eur,
    website: row.website,
    phone: row.phone,
    structureId: row.structure_id,
    structureName: structureRelation?.name ?? null,
    subscriptionTier: row.subscription_tier,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getProfessionalCategoryLabel(profile: Pick<
  ProfessionalProfile,
  "professionalKind" | "medicalCategory" | "supportCategory"
>) {
  if (profile.professionalKind === "medical" && profile.medicalCategory) {
    return MEDICAL_CATEGORY_LABELS[profile.medicalCategory];
  }

  if (profile.professionalKind === "support_care" && profile.supportCategory) {
    return SUPPORT_CATEGORY_LABELS[profile.supportCategory];
  }

  return "Accompagnement professionnel";
}

export function slugifyProfessionalName(displayName: string, userId: string) {
  const base = displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "professionnel"}-${userId.slice(0, 8)}`;
}

export async function getProfessionalDirectory(options?: {
  kind?: ProfessionalKind;
  country?: string;
}): Promise<ProfessionalProfile[]> {
  if (!hasSupabaseBrowserEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("professional_profiles")
    .select(
      `
        id,
        slug,
        professional_kind,
        medical_category,
        support_category,
        title,
        bio,
        city,
        country,
        consultation_modes,
        consultation_price_eur,
        website,
        phone,
        structure_id,
        subscription_tier,
        is_active,
        created_at,
        updated_at,
        profiles!inner(display_name),
        professional_structures(name)
      `,
    )
    .eq("is_active", true)
    .order("subscription_tier", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.kind) {
    query = query.eq("professional_kind", options.kind);
  }

  if (options?.country) {
    query = query.eq("country", options.country);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProfessionalRow[]).map(mapProfessionalRow);
}

export async function getProfessionalBySlug(slug: string): Promise<ProfessionalProfile | null> {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      `
        id,
        slug,
        professional_kind,
        medical_category,
        support_category,
        title,
        bio,
        city,
        country,
        consultation_modes,
        consultation_price_eur,
        website,
        phone,
        structure_id,
        subscription_tier,
        is_active,
        created_at,
        updated_at,
        profiles!inner(display_name),
        professional_structures(name)
      `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfessionalRow(data as ProfessionalRow) : null;
}

export async function getProfessionalProfileByUserId(
  userId: string,
): Promise<ProfessionalProfile | null> {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      `
        id,
        slug,
        professional_kind,
        medical_category,
        support_category,
        title,
        bio,
        city,
        country,
        consultation_modes,
        consultation_price_eur,
        website,
        phone,
        structure_id,
        subscription_tier,
        is_active,
        created_at,
        updated_at,
        profiles!inner(display_name),
        professional_structures(name)
      `,
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfessionalRow(data as ProfessionalRow) : null;
}

export async function getManagedProfessionals(): Promise<AdminManagedProfessional[]> {
  if (!hasSupabaseBrowserEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      `
        id,
        slug,
        professional_kind,
        medical_category,
        support_category,
        title,
        bio,
        city,
        country,
        consultation_modes,
        consultation_price_eur,
        website,
        phone,
        structure_id,
        subscription_tier,
        is_active,
        created_at,
        updated_at,
        profiles!inner(display_name),
        professional_structures(name)
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProfessionalRow[]).map((row) => {
    const profile = mapProfessionalRow(row);
    return {
      ...profile,
      categoryLabel: getProfessionalCategoryLabel(profile),
    };
  });
}
