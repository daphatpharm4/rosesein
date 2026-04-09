"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser, type ProfileKind } from "@/lib/auth";
import { hasSupabaseBrowserEnv } from "@/lib/env";
import { normalizeInternalPath } from "@/lib/internal-path";
import { getRequestSiteUrl } from "@/lib/request-site-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeProfileKind(value: FormDataEntryValue | null): ProfileKind | null {
  if (value === "patient" || value === "caregiver" || value === "professional") {
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

function appendStatus(targetPath: string, key: "status" | "error", value: string) {
  const url = new URL(targetPath, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}` as Route;
}

export async function signInWithMagicLink(formData: FormData) {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const redirectTo = normalizeInternalPath(
    typeof formData.get("redirectTo") === "string" ? (formData.get("redirectTo") as string) : null,
  );

  if (!email) {
    redirect(`/account?error=email-required&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (!hasSupabaseBrowserEnv()) {
    redirect(
      `/account?error=missing-supabase-env&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const callbackUrl = new URL("/auth/callback", await getRequestSiteUrl());
  callbackUrl.searchParams.set("next", redirectTo);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    redirect(`/account?error=magic-link-failed&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  redirect(`/account?status=magic-link-sent&redirectTo=${encodeURIComponent(redirectTo)}`);
}

export async function signOut() {
  if (hasSupabaseBrowserEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/account?status=signed-out");
}

export async function saveProfileSetup(formData: FormData) {
  const redirectTo = normalizeInternalPath(
    typeof formData.get("redirectTo") === "string" ? (formData.get("redirectTo") as string) : null,
  );
  const profileKind = normalizeProfileKind(formData.get("profileKind"));
  const displayName = normalizeDisplayName(formData.get("displayName"));
  const pseudonym = normalizeOptionalText(formData.get("pseudonym"));
  const isAnonymous = formData.get("isAnonymous") === "on";

  if (!profileKind) {
    redirect("/account?error=profile-kind-required");
  }

  if (displayName.length < 2) {
    redirect("/account?error=display-name-required");
  }

  if (!hasSupabaseBrowserEnv()) {
    redirect("/account?error=missing-supabase-env");
  }

  const user = await requireUser();

  if (profileKind === "professional") {
    const proRedirectUrl = new URL("/account/pro-onboarding", "http://localhost");
    proRedirectUrl.searchParams.set("displayName", displayName);
    proRedirectUrl.searchParams.set("redirectTo", redirectTo);
    redirect((proRedirectUrl.pathname + proRedirectUrl.search) as Route);
  }

  const supabase = await createSupabaseServerClient();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      profile_kind: profileKind,
      display_name: displayName,
      pseudonym,
      is_anonymous: isAnonymous,
    },
    {
      onConflict: "id",
    },
  );

  if (profileError) {
    redirect("/account?error=profile-save-failed");
  }

  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: user.id,
      role: "member",
    },
    {
      onConflict: "user_id,role",
      ignoreDuplicates: true,
    },
  );

  if (roleError) {
    redirect("/account?error=profile-save-failed");
  }

  const { error: preferencesError } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
      },
      {
        onConflict: "user_id",
      },
    );

  if (preferencesError) {
    redirect("/account?error=profile-save-failed");
  }

  redirect(appendStatus(redirectTo, "status", "profile-ready"));
}
