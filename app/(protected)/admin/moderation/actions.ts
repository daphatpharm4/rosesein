"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import type { ModerationActionType } from "@/lib/moderation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function appendFeedback(targetPath: string, key: "status" | "error", value: string) {
  const url = new URL(targetPath, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}` as Route;
}

function normalizeReportId(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeActionType(value: FormDataEntryValue | null): ModerationActionType | null {
  if (
    value === "review_note" ||
    value === "warn_member" ||
    value === "close_report" ||
    value === "escalate"
  ) {
    return value;
  }

  return null;
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function recordModerationAction(formData: FormData) {
  const reportId = normalizeReportId(formData.get("reportId"));
  const actionType = normalizeActionType(formData.get("actionType"));
  const notes = normalizeOptionalText(formData.get("notes"));
  const escalationTarget = normalizeOptionalText(formData.get("escalationTarget"));

  if (!reportId || !actionType) {
    redirect("/admin/moderation?error=moderation-action-invalid");
  }

  if (actionType === "escalate" && !escalationTarget) {
    redirect("/admin/moderation?error=escalation-target-required");
  }

  await requireStaff("/admin/moderation");
  const supabase = await createSupabaseServerClient();
  const { data: report } = await supabase
    .from("content_reports")
    .select("id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) {
    redirect("/admin/moderation?error=report-not-found");
  }

  const { error } = await supabase.rpc("apply_moderation_action", {
    candidate_report_id: reportId,
    candidate_action_type: actionType,
    candidate_notes: notes,
    candidate_escalation_target: escalationTarget,
  });

  if (error) {
    redirect("/admin/moderation?error=moderation-action-failed");
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/messages");
  redirect(appendFeedback("/admin/moderation", "status", "moderation-action-recorded"));
}
