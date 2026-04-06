"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { notifyManyUsers } from "@/lib/app-notifications";
import { recordAdminAudit } from "@/lib/admin-audit";
import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BroadcastSegment } from "@/lib/admin-messaging";

const VALID_SEGMENTS = new Set<string>(["all", "patient", "caregiver"]);

async function getBroadcastRecipientIds(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  segment: BroadcastSegment
) {
  let query = supabase.from("profiles").select("id, profile_kind");

  if (segment !== "all") {
    query = query.eq("profile_kind", segment);
  }

  const { data: profiles } = await query;
  const candidateIds = (profiles ?? []).map((profile) => profile.id as string);

  if (candidateIds.length === 0) {
    return [];
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", candidateIds);

  const excludedIds = new Set(
    (roles ?? [])
      .filter((role) => role.role === "admin" || role.role === "moderator")
      .map((role) => role.user_id as string)
  );

  return candidateIds.filter((id) => !excludedIds.has(id));
}

export async function sendBroadcast(formData: FormData): Promise<void> {
  const { user } = await requireStaff("/admin/messagerie");

  const subject = (formData.get("subject") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const segment = (formData.get("segment") as string | null)?.trim() ?? "";

  if (!subject) redirect("/admin/messagerie?error=subject-required" as Route);
  if (body.length < 10) redirect("/admin/messagerie?error=body-too-short" as Route);
  if (!VALID_SEGMENTS.has(segment)) redirect("/admin/messagerie?error=segment-invalid" as Route);
  const supabase = await createSupabaseServerClient();
  const recipientIds = await getBroadcastRecipientIds(supabase, segment as BroadcastSegment);

  const { data: recipientCount, error } = await supabase.rpc("send_broadcast", {
    p_subject: subject,
    p_body: body,
    p_segment: segment as BroadcastSegment,
    p_sender_id: user.id,
  });

  if (error) redirect("/admin/messagerie?error=broadcast-failed" as Route);

  await notifyManyUsers(
    recipientIds.map((recipientId) => ({
      userId: recipientId,
      kind: "message",
      title: subject,
      body: body.slice(0, 140),
      href: "/messages",
    }))
  );

  await recordAdminAudit({
    actionType: "broadcast_sent",
    targetKind: "segment",
    targetId: segment,
    summary: `Diffusion collective envoyee au segment ${segment}.`,
    metadata: {
      subject,
      recipientCount: Number(recipientCount ?? recipientIds.length),
    },
  });

  revalidatePath("/messages");
  revalidatePath("/admin/messagerie");
  redirect("/admin/messagerie?status=broadcast-sent" as Route);
}

export async function createGroup(formData: FormData): Promise<void> {
  const { user } = await requireStaff("/admin/messagerie");

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const memberIds = (formData.getAll("memberIds") as string[]).filter(Boolean);

  if (!title) redirect("/admin/messagerie?error=title-required" as Route);
  if (body.length < 10) redirect("/admin/messagerie?error=body-too-short" as Route);
  if (memberIds.length === 0) redirect("/admin/messagerie?error=no-members" as Route);
  const supabase = await createSupabaseServerClient();

  const { data: threadData, error: threadError } = await supabase
    .from("conversation_threads")
    .insert({ kind: "group", title, is_official: true, created_by: user.id })
    .select("id")
    .single();

  if (threadError || !threadData) redirect("/admin/messagerie?error=group-failed" as Route);

  const threadId = threadData.id as string;

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

  await notifyManyUsers(
    memberIds.map((memberId) => ({
      userId: memberId,
      kind: "message",
      title: `Nouveau groupe: ${title}`,
      body: body.slice(0, 140),
      href: `/messages/${threadId}`,
    }))
  );

  await recordAdminAudit({
    actionType: "group_created",
    targetKind: "conversation_thread",
    targetId: threadId,
    summary: `Groupe officiel cree: ${title}.`,
    metadata: {
      participantCount: allParticipantIds.length,
    },
  });

  revalidatePath("/messages");
  revalidatePath("/admin/messagerie");
  redirect("/admin/messagerie?status=group-created" as Route);
}
