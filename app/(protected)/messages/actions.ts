"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompletedProfile } from "@/lib/auth";
import { notifyUser } from "@/lib/app-notifications";
import type { ReportReason } from "@/lib/moderation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeThreadId(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBody(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeReportReason(value: FormDataEntryValue | null): ReportReason | null {
  if (
    value === "abuse" ||
    value === "misinformation" ||
    value === "privacy" ||
    value === "impersonation" ||
    value === "other"
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

function normalizeMessageId(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function sendMessage(formData: FormData) {
  const threadId = normalizeThreadId(formData.get("threadId"));
  const body = normalizeBody(formData.get("body"));

  if (!threadId) {
    redirect("/messages?error=thread-not-found");
  }

  if (!body) {
    redirect(`/messages/${threadId}?error=message-required`);
  }

  const { user } = await requireCompletedProfile(`/messages/${threadId}`);
  const supabase = await createSupabaseServerClient();

  const { data: membership } = await supabase
    .from("thread_participants")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/messages?error=thread-not-found");
  }

  const { error } = await supabase.from("messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    body,
  });

  if (error) {
    redirect(`/messages/${threadId}?error=message-send-failed`);
  }

  const { data: participants } = await supabase
    .from("thread_participants")
    .select("user_id")
    .eq("thread_id", threadId);

  const recipients = (participants ?? [])
    .map((participant) => participant.user_id as string)
    .filter((participantId) => participantId !== user.id);

  await Promise.all(
    recipients.map((recipientId) =>
      notifyUser({
        userId: recipientId,
        kind: "message",
        title: "Nouveau message privé",
        body: body.slice(0, 140),
        href: `/messages/${threadId}`,
      })
    )
  );

  revalidatePath("/messages");
  revalidatePath(`/messages/${threadId}`);
  redirect(`/messages/${threadId}?status=message-sent`);
}

export async function startDirectConversation(formData: FormData) {
  const targetUserId = normalizeThreadId(formData.get("targetUserId"));
  const body = normalizeBody(formData.get("body"));

  if (!targetUserId || !body) {
    redirect("/messages/nouveau?error=message-required");
  }

  const { user } = await requireCompletedProfile("/messages/nouveau");
  const supabase = await createSupabaseServerClient();
  const { data: threadId, error: threadError } = await supabase.rpc("open_direct_conversation", {
    candidate_target_user_id: targetUserId,
  });

  if (threadError || !threadId) {
    redirect("/messages/nouveau?error=thread-not-found");
  }

  const { error: insertError } = await supabase.from("messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    body,
  });

  if (insertError) {
    redirect("/messages/nouveau?error=message-send-failed");
  }

  await notifyUser({
    userId: targetUserId,
    kind: "message",
    title: "Un membre souhaite échanger avec vous",
    body: body.slice(0, 140),
    href: `/messages/${threadId}`,
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${threadId}`);
  redirect(`/messages/${threadId}?status=message-sent`);
}

export async function createMessageReport(formData: FormData) {
  const threadId = normalizeThreadId(formData.get("threadId"));
  const messageId = normalizeMessageId(formData.get("messageId"));
  const reason = normalizeReportReason(formData.get("reason"));
  const details = normalizeOptionalText(formData.get("details"));

  if (!threadId) {
    redirect("/messages?error=thread-not-found");
  }

  if (!messageId || !reason) {
    redirect(`/messages/${threadId}?error=report-create-failed`);
  }

  const { user } = await requireCompletedProfile(`/messages/${threadId}`);
  const supabase = await createSupabaseServerClient();

  const [{ data: membership }, { data: message }] = await Promise.all([
    supabase
      .from("thread_participants")
      .select("thread_id")
      .eq("thread_id", threadId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, thread_id, sender_id")
      .eq("id", messageId)
      .maybeSingle(),
  ]);

  if (!membership || !message || message.thread_id !== threadId) {
    redirect(`/messages/${threadId}?error=report-create-failed`);
  }

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    target_kind: "message",
    message_id: message.id,
    thread_id: threadId,
    target_user_id: message.sender_id,
    reason,
    details,
  });

  if (error) {
    redirect(`/messages/${threadId}?error=report-create-failed`);
  }

  revalidatePath("/admin/moderation");
  redirect(`/messages/${threadId}?status=report-created`);
}
