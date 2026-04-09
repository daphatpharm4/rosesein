import "server-only";

import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfessionalKind = "medical" | "support_care";
export type SubscriptionTier = "solidaire" | "visibilite_agenda" | "partenaire";
export type ConsultationMode = "presentiel" | "telephone" | "visio";
type ProfessionalAppointmentStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";

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

export type SubscriptionTierDefinition = {
  label: string;
  summary: string;
  publicHeadline: string;
  publicDescription: string;
  dashboardHeadline: string;
  dashboardDescription: string;
  benefits: string[];
};

export type ProfessionalPerformanceStats = {
  profileViews30d: number;
  appointmentRequests30d: number;
  confirmedAppointments30d: number;
  confirmationRate: number;
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

export const SUBSCRIPTION_TIER_DEFINITIONS: Record<SubscriptionTier, SubscriptionTierDefinition> = {
  solidaire: {
    label: "Solidaire",
    summary: "Présence simple dans l'annuaire avec contact direct.",
    publicHeadline: "Présence solidaire dans l'annuaire",
    publicDescription:
      "La fiche rend le professionnel visible et joignable, sans agenda intégré dans la plateforme.",
    dashboardHeadline: "Présence de base",
    dashboardDescription:
      "Une fiche claire, un contact direct et une visibilité simple pour rester trouvable sans ajouter de charge outil.",
    benefits: [
      "Fiche publique dans l'annuaire professionnel",
      "Contact direct depuis la fiche",
      "Visibilité de base dans les résultats",
    ],
  },
  visibilite_agenda: {
    label: "Visibilité + agenda",
    summary: "Annuaire, créneaux publiés et demandes de rendez-vous intégrées.",
    publicHeadline: "Agenda intégré ROSE-SEIN",
    publicDescription:
      "La fiche permet de consulter les disponibilités et d'envoyer une demande de rendez-vous directement depuis l'application.",
    dashboardHeadline: "Visibilité active",
    dashboardDescription:
      "La fiche devient un point d'entrée opérationnel: créneaux publiés, demandes reçues et suivi simple des confirmations.",
    benefits: [
      "Tout le socle Solidaire",
      "Créneaux publiés sur la fiche publique",
      "Demandes de rendez-vous depuis ROSE-SEIN",
    ],
  },
  partenaire: {
    label: "Partenaire",
    summary:
      "Mise en avant éditoriale, agenda intégré, ateliers/webinaires et lecture des indicateurs clés.",
    publicHeadline: "Professionnel partenaire ROSE-SEIN",
    publicDescription:
      "La fiche bénéficie d'une mise en avant éditoriale dans l'écosystème ROSE-SEIN, sans constituer une recommandation médicale personnalisée.",
    dashboardHeadline: "Visibilité partenaire",
    dashboardDescription:
      "En plus de l'agenda intégré, l'offre partenaire active une mise en avant sur l'accueil, l'animation d'ateliers ou webinaires, et des indicateurs simples sur la visibilité et les demandes.",
    benefits: [
      "Tout ce qui est inclus dans Visibilité + agenda",
      "Mise en avant dédiée sur l'accueil",
      "Publication d'ateliers et de webinaires depuis l'espace pro",
      "Indicateurs 30 jours sur la fiche et les demandes",
    ],
  },
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

export async function getFeaturedPartnerProfessionals(limit = 3): Promise<ProfessionalProfile[]> {
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
    .eq("is_active", true)
    .eq("subscription_tier", "partenaire")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProfessionalRow[]).map(mapProfessionalRow);
}

export async function trackProfessionalProfileView(
  professionalId: string,
  viewerId?: string | null,
) {
  if (!hasSupabaseBrowserEnv()) {
    return;
  }

  if (viewerId && viewerId === professionalId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const viewedOn = new Date().toISOString().slice(0, 10);
  const payload = viewerId
    ? {
        professional_id: professionalId,
        viewer_id: viewerId,
        viewed_on: viewedOn,
      }
    : {
        professional_id: professionalId,
        viewed_on: viewedOn,
      };

  const { error } = viewerId
    ? await supabase
        .from("professional_profile_views")
        .upsert(payload, {
          onConflict: "professional_id,viewer_id,viewed_on",
          ignoreDuplicates: true,
        })
    : await supabase.from("professional_profile_views").insert(payload);

  if (error) {
    console.error("Failed to track professional profile view", error);
  }
}

export async function getProfessionalPerformanceStats(
  professionalId: string,
): Promise<ProfessionalPerformanceStats> {
  if (!hasSupabaseBrowserEnv()) {
    return {
      profileViews30d: 0,
      appointmentRequests30d: 0,
      confirmedAppointments30d: 0,
      confirmationRate: 0,
    };
  }

  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString();

  const [
    { count: profileViews30d, error: viewError },
    { data: appointmentRows, error: appointmentError },
  ] = await Promise.all([
    supabase
      .from("professional_profile_views")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId)
      .gte("created_at", since),
    supabase
      .from("professional_appointments")
      .select("status")
      .eq("professional_id", professionalId)
      .gte("created_at", since),
  ]);

  if (viewError) {
    console.error("Failed to load professional profile views", viewError);
  }

  if (appointmentError) {
    console.error("Failed to load professional appointment stats", appointmentError);
  }

  const appointments = appointmentError
    ? []
    : ((appointmentRows ?? []) as Array<{ status: ProfessionalAppointmentStatus }>).map(
        (row) => row.status,
      );
  const appointmentRequests30d = appointments.length;
  const confirmedAppointments30d = appointments.filter(
    (status) => status === "confirmed" || status === "completed",
  ).length;

  return {
    profileViews30d: viewError ? 0 : (profileViews30d ?? 0),
    appointmentRequests30d,
    confirmedAppointments30d,
    confirmationRate:
      appointmentRequests30d > 0
        ? Math.round((confirmedAppointments30d / appointmentRequests30d) * 100)
        : 0,
  };
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
