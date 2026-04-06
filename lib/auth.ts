import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileKind = "patient" | "caregiver";
export type PlatformRole = "member" | "moderator" | "admin";

export type UserProfile = {
  id: string;
  profileKind: ProfileKind;
  displayName: string;
  pseudonym: string | null;
  isAnonymous: boolean;
  difficultDayMode: boolean;
};

export const getCurrentUserContext = cache(async () => {
  if (!hasSupabaseBrowserEnv()) {
    return {
      user: null,
      configured: false,
      profile: null,
      roles: [] as PlatformRole[],
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      configured: true,
      profile: null,
      roles: [] as PlatformRole[],
    };
  }

  const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, profile_kind, display_name, pseudonym, is_anonymous, difficult_day_mode")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const profile = profileRow
    ? {
        id: profileRow.id,
        profileKind: profileRow.profile_kind as ProfileKind,
        displayName: profileRow.display_name,
        pseudonym: profileRow.pseudonym,
        isAnonymous: profileRow.is_anonymous,
        difficultDayMode: profileRow.difficult_day_mode ?? false,
      }
    : null;

  const roles = (roleRows ?? []).map((row) => row.role as PlatformRole);

  return {
    user,
    configured: true,
    profile,
    roles,
  };
});

export const getCurrentUser = cache(async () => {
  const { user, configured } = await getCurrentUserContext();
  return { user, configured };
});

export async function requireUser() {
  const { user, configured } = await getCurrentUser();

  if (!configured) {
    redirect("/account?error=missing-supabase-env");
  }

  if (!user) {
    redirect("/account");
  }

  return user;
}

export async function requireCompletedProfile(redirectTo = "/messages") {
  const context = await getCurrentUserContext();

  if (!context.configured) {
    redirect("/account?error=missing-supabase-env");
  }

  if (!context.user) {
    redirect("/account");
  }

  if (!context.profile) {
    redirect(`/account?status=complete-profile&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return context;
}

export async function requireStaff(redirectTo = "/admin/moderation") {
  const context = await requireCompletedProfile(redirectTo);
  const hasStaffRole = context.roles.some((role) => role === "moderator" || role === "admin");

  if (!hasStaffRole) {
    notFound();
  }

  return context;
}

export async function requireAdmin(redirectTo = "/admin/utilisateurs") {
  const context = await requireCompletedProfile(redirectTo);

  if (!context.roles.includes("admin")) {
    notFound();
  }

  return context;
}
