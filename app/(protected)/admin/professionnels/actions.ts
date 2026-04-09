"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Route } from "next";

import { requireAdmin } from "@/lib/auth";
import type { SubscriptionTier } from "@/lib/professional";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function appendFeedback(targetPath: string, key: "status" | "error", value: string) {
  const url = new URL(targetPath, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}` as Route;
}

function normalizeTier(value: FormDataEntryValue | null): SubscriptionTier | null {
  return value === "solidaire" || value === "visibilite_agenda" || value === "partenaire"
    ? value
    : null;
}

export async function updateSubscriptionTier(formData: FormData) {
  await requireAdmin("/admin/professionnels");
  const professionalId = typeof formData.get("professionalId") === "string"
    ? (formData.get("professionalId") as string)
    : "";
  const tier = normalizeTier(formData.get("subscriptionTier"));

  if (!professionalId || !tier) {
    redirect("/admin/professionnels?error=tier-invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("professional_profiles")
    .update({ subscription_tier: tier })
    .eq("id", professionalId);

  if (error) {
    redirect("/admin/professionnels?error=tier-save-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/professionnels");
  redirect(appendFeedback("/admin/professionnels", "status", "tier-updated"));
}

export async function toggleProfessionalActive(formData: FormData) {
  await requireAdmin("/admin/professionnels");
  const professionalId = typeof formData.get("professionalId") === "string"
    ? (formData.get("professionalId") as string)
    : "";
  const nextValue = formData.get("isActive") === "true";

  if (!professionalId) {
    redirect("/admin/professionnels?error=toggle-invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("professional_profiles")
    .update({ is_active: nextValue })
    .eq("id", professionalId);

  if (error) {
    redirect("/admin/professionnels?error=toggle-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/professionnels");
  redirect(appendFeedback("/admin/professionnels", "status", "professional-updated"));
}
