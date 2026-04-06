"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BroadcastSegment } from "@/lib/admin-messaging";

const VALID_SEGMENTS = new Set<string>(["all", "patient", "caregiver"]);

export async function sendBroadcast(formData: FormData): Promise<void> {
  const subject = (formData.get("subject") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const segment = (formData.get("segment") as string | null)?.trim() ?? "";

  if (!subject) redirect("/admin/messagerie?error=subject-required" as Route);
  if (body.length < 10) redirect("/admin/messagerie?error=body-too-short" as Route);
  if (!VALID_SEGMENTS.has(segment)) redirect("/admin/messagerie?error=segment-invalid" as Route);

  const { user } = await requireStaff("/admin/messagerie");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("send_broadcast", {
    p_subject: subject,
    p_body: body,
    p_segment: segment as BroadcastSegment,
    p_sender_id: user.id,
  });

  if (error) redirect("/admin/messagerie?error=broadcast-failed" as Route);

  revalidatePath("/admin/messagerie");
  redirect("/admin/messagerie" as Route);
}

export async function createGroup(formData: FormData): Promise<void> {
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const memberIds = (formData.getAll("memberIds") as string[]).filter(Boolean);

  if (!title) redirect("/admin/messagerie?error=title-required" as Route);
  if (body.length < 10) redirect("/admin/messagerie?error=body-too-short" as Route);
  if (memberIds.length === 0) redirect("/admin/messagerie?error=no-members" as Route);

  const { user } = await requireStaff("/admin/messagerie");
  const supabase = await createSupabaseServerClient();

  const { data: threadData, error: threadError } = await supabase
    .from("conversation_threads")
    .insert({ kind: "group", title, is_official: true, created_by: user.id })
    .select("id")
    .single();

  if (threadError || !threadData) redirect("/admin/messagerie?error=group-failed" as Route);

  const threadId = (threadData as { id: string }).id;

  const allParticipantIds = Array.from(new Set([...memberIds, user.id]));
  const participantRows = allParticipantIds.map((userId) => ({
    thread_id: threadId,
    user_id: userId,
  }));

  const { error: participantsError } = await supabase
    .from("thread_participants")
    .insert(participantRows);

  if (participantsError) redirect("/admin/messagerie?error=group-failed" as Route);

  const { error: messageError } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender_id: user.id, body });

  if (messageError) redirect("/admin/messagerie?error=group-failed" as Route);

  revalidatePath("/admin/messagerie");
  redirect("/admin/messagerie" as Route);
}
