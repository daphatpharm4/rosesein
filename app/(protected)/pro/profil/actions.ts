"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Route } from "next";

import { requireProfessional } from "@/lib/auth";
import {
  getProfessionalProfileByUserId,
  slugifyProfessionalName,
  type ConsultationMode,
  type MedicalCategory,
  type ProfessionalKind,
  type SupportCategory,
} from "@/lib/professional";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function appendFeedback(targetPath: string, key: "status" | "error", value: string) {
  const url = new URL(targetPath, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}` as Route;
}

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const trimmed = normalizeText(value);
  return trimmed ? trimmed : null;
}

function normalizeProfessionalKind(value: FormDataEntryValue | null): ProfessionalKind | null {
  return value === "medical" || value === "support_care" ? value : null;
}

const MEDICAL_CATEGORY_VALUES = new Set<MedicalCategory>([
  "oncologue",
  "chirurgien_senologue",
  "radiotherapeute",
  "medecin_generaliste",
  "infirmier_coordinateur",
  "kinesitherapeute",
  "pharmacien",
  "radiologue",
]);

const SUPPORT_CATEGORY_VALUES = new Set<SupportCategory>([
  "psychologue",
  "nutritionniste",
  "socio_estheticien",
  "sophrologue",
  "coach_apa",
  "assistant_social",
  "acupuncteur",
  "osteopathe",
  "praticien_yoga",
]);

function normalizeMedicalCategory(value: FormDataEntryValue | null): MedicalCategory | null {
  const normalized = normalizeOptionalText(value);
  return normalized && MEDICAL_CATEGORY_VALUES.has(normalized as MedicalCategory)
    ? (normalized as MedicalCategory)
    : null;
}

function normalizeSupportCategory(value: FormDataEntryValue | null): SupportCategory | null {
  const normalized = normalizeOptionalText(value);
  return normalized && SUPPORT_CATEGORY_VALUES.has(normalized as SupportCategory)
    ? (normalized as SupportCategory)
    : null;
}

function normalizeConsultationModes(values: FormDataEntryValue[]): ConsultationMode[] {
  return values.filter(
    (value): value is ConsultationMode =>
      value === "presentiel" || value === "telephone" || value === "visio",
  );
}

export async function saveProfessionalProfile(formData: FormData) {
  const { user } = await requireProfessional("/pro/profil");
  const existingProfile = await getProfessionalProfileByUserId(user.id);

  if (!existingProfile) {
    redirect("/account/pro-onboarding?status=complete-pro-profile&redirectTo=/pro/profil");
  }

  const displayName = normalizeText(formData.get("displayName"));
  const title = normalizeOptionalText(formData.get("title"));
  const professionalKind = normalizeProfessionalKind(formData.get("professionalKind"));
  const rawMedicalCategory = normalizeOptionalText(formData.get("medicalCategory"));
  const rawSupportCategory = normalizeOptionalText(formData.get("supportCategory"));
  const medicalCategory = normalizeMedicalCategory(formData.get("medicalCategory"));
  const supportCategory = normalizeSupportCategory(formData.get("supportCategory"));
  const bio = normalizeOptionalText(formData.get("bio"));
  const city = normalizeOptionalText(formData.get("city"));
  const country = normalizeText(formData.get("country")).toUpperCase() || "FR";
  const phone = normalizeOptionalText(formData.get("phone"));
  const website = normalizeOptionalText(formData.get("website"));
  const consultationModes = normalizeConsultationModes(formData.getAll("consultationModes"));
  const priceValue = normalizeOptionalText(formData.get("consultationPriceEur"));
  const consultationPriceEur = priceValue ? Number.parseInt(priceValue, 10) : null;
  const isActive = formData.get("isActive") === "on";

  if (displayName.length < 2 || !professionalKind) {
    redirect("/pro/profil?error=profile-invalid");
  }

  if (
    (professionalKind === "medical" && rawSupportCategory)
    || (professionalKind === "support_care" && rawMedicalCategory)
  ) {
    redirect("/pro/profil?error=category-exclusive");
  }

  if (
    (professionalKind === "medical" && !medicalCategory)
    || (professionalKind === "support_care" && !supportCategory)
  ) {
    redirect("/pro/profil?error=category-required");
  }

  if (consultationPriceEur !== null && Number.isNaN(consultationPriceEur)) {
    redirect("/pro/profil?error=price-invalid");
  }

  const supabase = await createSupabaseServerClient();
  const slug = existingProfile.slug || slugifyProfessionalName(displayName, user.id);

  const { error: baseProfileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      profile_kind: "professional",
      is_anonymous: false,
    })
    .eq("id", user.id);

  if (baseProfileError) {
    redirect("/pro/profil?error=profile-save-failed");
  }

  const { error: professionalError } = await supabase
    .from("professional_profiles")
    .update({
      professional_kind: professionalKind,
      medical_category: professionalKind === "medical" ? medicalCategory : null,
      support_category: professionalKind === "support_care" ? supportCategory : null,
      title,
      bio,
      city,
      country,
      phone,
      website,
      consultation_modes: consultationModes.length > 0 ? consultationModes : ["presentiel"],
      consultation_price_eur: consultationPriceEur,
      is_active: isActive,
      slug,
    })
    .eq("id", user.id);

  if (professionalError) {
    redirect("/pro/profil?error=profile-save-failed");
  }

  revalidatePath("/pro");
  revalidatePath("/pro/profil");
  revalidatePath(`/professionnels/${slug}`);
  redirect(appendFeedback("/pro/profil", "status", "profile-saved"));
}
