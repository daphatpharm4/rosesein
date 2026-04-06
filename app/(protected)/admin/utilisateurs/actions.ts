"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAdminAudit } from "@/lib/admin-audit";
import { requireAdmin } from "@/lib/auth";
import type { PlatformRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MANAGED_ROLES: PlatformRole[] = ["moderator", "admin"];

function appendFeedback(targetPath: string, key: "status" | "error", value: string) {
  const url = new URL(targetPath, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}` as Route;
}

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: FormDataEntryValue | null): PlatformRole | null {
  if (typeof value !== "string") {
    return null;
  }

  return MANAGED_ROLES.includes(value as PlatformRole) ? (value as PlatformRole) : null;
}

export async function updateManagedUserRole(formData: FormData) {
  const userId = normalizeText(formData.get("userId"));
  const role = normalizeRole(formData.get("role"));
  const enabled = normalizeText(formData.get("enabled")) === "true";

  if (!userId || !role) {
    redirect("/admin/utilisateurs?error=role-invalid" as Route);
  }

  const { user } = await requireAdmin("/admin/utilisateurs");

  if (user.id === userId && role === "admin" && !enabled) {
    redirect("/admin/utilisateurs?error=self-admin-lock" as Route);
  }

  const supabase = await createSupabaseServerClient();

  if (enabled) {
    const { error } = await supabase.from("user_roles").upsert(
      {
        user_id: userId,
        role,
      },
      {
        onConflict: "user_id,role",
        ignoreDuplicates: true,
      }
    );

    if (error) {
      redirect(appendFeedback("/admin/utilisateurs", "error", "role-update-failed"));
    }
  } else {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) {
      redirect(appendFeedback("/admin/utilisateurs", "error", "role-update-failed"));
    }
  }

  await recordAdminAudit({
    actionType: enabled ? "role_granted" : "role_revoked",
    targetKind: "user",
    targetId: userId,
    summary: `${enabled ? "Ajout" : "Retrait"} du role ${role}.`,
    metadata: { role },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/utilisateurs");
  redirect(appendFeedback("/admin/utilisateurs", "status", "role-updated"));
}
