"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { getCurrentUserContext, requireUser } from "@/lib/auth";
import { normalizeInternalPath } from "@/lib/internal-path";
import {
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

function normalizeConsultationModes(values: FormDataEntryValue[]): ConsultationMode[] {
  return values.filter(
    (value): value is ConsultationMode =>
      value === "presentiel" || value === "telephone" || value === "visio",
  );
}

export async function createProfessionalAccount(formData: FormData) {
  const redirectTo = normalizeInternalPath(
    typeof formData.get("redirectTo") === "string" ? (formData.get("redirectTo") as string) : null,
  );
  const user = await requireUser();
  const context = await getCurrentUserContext();

  if (context.profile && context.profile.profileKind !== "professional") {
    redirect("/account?error=professional-space-forbidden");
  }

  const displayName = normalizeText(formData.get("displayName"));
  const title = normalizeOptionalText(formData.get("title"));
  const professionalKind = normalizeProfessionalKind(formData.get("professionalKind"));
  const medicalCategory = normalizeOptionalText(formData.get("medicalCategory")) as MedicalCategory | null;
  const supportCategory = normalizeOptionalText(formData.get("supportCategory")) as SupportCategory | null;
  const city = normalizeOptionalText(formData.get("city"));
  const country = normalizeText(formData.get("country")).toUpperCase() || "FR";
  const bio = normalizeOptionalText(formData.get("bio"));
  const phone = normalizeOptionalText(formData.get("phone"));
  const website = normalizeOptionalText(formData.get("website"));
  const consultationModes = normalizeConsultationModes(formData.getAll("consultationModes"));
  const priceValue = normalizeOptionalText(formData.get("consultationPriceEur"));
  const consultationPriceEur = priceValue ? Number.parseInt(priceValue, 10) : null;

  if (displayName.length < 2 || !professionalKind) {
    redirect("/account/pro-onboarding?error=missing-fields");
  }

  if (
    (professionalKind === "medical" && !medicalCategory)
    || (professionalKind === "support_care" && !supportCategory)
  ) {
    redirect("/account/pro-onboarding?error=category-required");
  }

  if (consultationPriceEur !== null && Number.isNaN(consultationPriceEur)) {
    redirect("/account/pro-onboarding?error=price-invalid");
  }

  const supabase = await createSupabaseServerClient();
  const slug = slugifyProfessionalName(displayName, user.id);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      profile_kind: "professional",
      display_name: displayName,
      is_anonymous: false,
    },
    {
      onConflict: "id",
    },
  );

  if (profileError) {
    redirect("/account/pro-onboarding?error=profile-save-failed");
  }

  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: user.id,
      role: "professional",
    },
    {
      onConflict: "user_id,role",
      ignoreDuplicates: true,
    },
  );

  if (roleError) {
    redirect("/account/pro-onboarding?error=profile-save-failed");
  }

  const { error: preferencesError } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
    },
    {
      onConflict: "user_id",
    },
  );

  if (preferencesError) {
    redirect("/account/pro-onboarding?error=profile-save-failed");
  }

  const { error: professionalError } = await supabase.from("professional_profiles").upsert(
    {
      id: user.id,
      professional_kind: professionalKind,
      medical_category: professionalKind === "medical" ? medicalCategory : null,
      support_category: professionalKind === "support_care" ? supportCategory : null,
      title,
      bio,
      city,
      country,
      consultation_modes: consultationModes.length > 0 ? consultationModes : ["presentiel"],
      consultation_price_eur: consultationPriceEur,
      website,
      phone,
      slug,
      subscription_tier: "solidaire",
      is_active: true,
    },
    {
      onConflict: "id",
    },
  );

  if (professionalError) {
    redirect("/account/pro-onboarding?error=pro-profile-save-failed");
  }

  redirect(appendFeedback(redirectTo === "/messages" ? "/pro" : redirectTo, "status", "profile-ready"));
}
