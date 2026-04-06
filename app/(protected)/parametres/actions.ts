"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompletedProfile, type ProfileKind } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function appendFeedback(targetPath: string, key: "status" | "error", value: string) {
  const url = new URL(targetPath, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}` as Route;
}

function normalizeProfileKind(value: FormDataEntryValue | null): ProfileKind | null {
  if (value === "patient" || value === "caregiver") {
    return value;
  }

  return null;
}

function normalizeDisplayName(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function updateProfileSettings(formData: FormData) {
  const profileKind = normalizeProfileKind(formData.get("profileKind"));
  const displayName = normalizeDisplayName(formData.get("displayName"));
  const pseudonym = normalizeOptionalText(formData.get("pseudonym"));
  const isAnonymous = formData.get("isAnonymous") === "on";
  const difficultDayMode = formData.get("difficultDayMode") === "on";

  if (!profileKind) {
    redirect("/parametres?error=profile-kind-required");
  }

  if (displayName.length < 2) {
    redirect("/parametres?error=display-name-required");
  }

  const { user } = await requireCompletedProfile("/parametres");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      profile_kind: profileKind,
      display_name: displayName,
      pseudonym,
      is_anonymous: isAnonymous,
      difficult_day_mode: difficultDayMode,
    })
    .eq("id", user.id);

  if (error) {
    redirect("/parametres?error=profile-update-failed");
  }

  revalidatePath("/parametres");
  redirect(appendFeedback("/parametres", "status", "profile-updated"));
}

export async function updateNotificationPreferences(formData: FormData) {
  const { user } = await requireCompletedProfile("/parametres");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      messages_enabled: formData.get("messagesEnabled") === "on",
      replies_enabled: formData.get("repliesEnabled") === "on",
      news_enabled: formData.get("newsEnabled") === "on",
      events_enabled: formData.get("eventsEnabled") === "on",
      email_enabled: formData.get("emailEnabled") === "on",
      push_enabled: formData.get("pushEnabled") === "on",
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    redirect("/parametres?error=preferences-update-failed");
  }

  revalidatePath("/parametres");
  redirect(appendFeedback("/parametres", "status", "preferences-updated"));
}

export async function submitPrivacyRequest(formData: FormData) {
  const requestKind = normalizeOptionalText(formData.get("requestKind"));
  const details = normalizeOptionalText(formData.get("details"));

  if (!requestKind || !["export", "deletion", "correction"].includes(requestKind)) {
    redirect("/parametres?error=preferences-update-failed");
  }

  const { user } = await requireCompletedProfile("/parametres");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("privacy_requests").insert({
    user_id: user.id,
    request_kind: requestKind,
    details,
  });

  if (error) {
    redirect("/parametres?error=preferences-update-failed");
  }

  revalidatePath("/parametres");
  redirect(appendFeedback("/parametres", "status", "privacy-request-sent"));
}
