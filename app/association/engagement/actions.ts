"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_REQUEST_KINDS = new Set([
  "membership",
  "donation",
  "volunteer",
  "mentorship",
  "support",
]);

function appendFeedback(targetPath: string, key: "status" | "error", value: string) {
  const url = new URL(targetPath, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}` as Route;
}

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = normalizeText(value);
  return normalized || null;
}

export async function submitAssociationEngagementRequest(formData: FormData) {
  const requestKind = normalizeText(formData.get("requestKind"));
  const name = normalizeText(formData.get("name"));
  const email = normalizeOptionalText(formData.get("email"));
  const phone = normalizeOptionalText(formData.get("phone"));
  const message = normalizeOptionalText(formData.get("message"));

  if (!VALID_REQUEST_KINDS.has(requestKind) || name.length < 2) {
    redirect(appendFeedback("/association/engagement", "error", "engagement-invalid"));
  }

  const { user } = await requireCompletedProfile("/association/engagement");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("association_engagement_requests").insert({
    user_id: user.id,
    request_kind: requestKind,
    name,
    email: email ?? user.email ?? null,
    phone,
    message,
  });

  if (error) {
    redirect(appendFeedback("/association/engagement", "error", "engagement-failed"));
  }

  revalidatePath("/association");
  revalidatePath("/association/engagement");
  redirect(appendFeedback("/association/engagement", "status", "engagement-sent"));
}
