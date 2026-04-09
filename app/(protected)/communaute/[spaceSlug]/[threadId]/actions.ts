"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { notifyManyUsers } from "@/lib/app-notifications";
import { requireCompletedProfile } from "@/lib/auth";
import {
  getCommunityThreadContext,
  isCommunitySpaceAccessible,
} from "@/lib/communaute";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function postReply(formData: FormData) {
  const threadId = formData.get("threadId");
  const spaceSlug = formData.get("spaceSlug");
  const body =
    typeof formData.get("body") === "string"
      ? (formData.get("body") as string).trim()
      : "";
  const isAnonymous = formData.get("isAnonymous") === "on";

  if (typeof threadId !== "string" || !threadId) {
    redirect("/communaute");
  }

  if (body.length < 2) {
    redirect(`/communaute/${spaceSlug}/${threadId}?error=body-required`);
  }

  const { user, profile, roles } = await requireCompletedProfile("/communaute");
  if (!profile) redirect("/account?status=complete-profile");
  const threadContext = await getCommunityThreadContext(threadId);

  if (
    !threadContext ||
    !isCommunitySpaceAccessible(threadContext.allowedKind, profile.profileKind, roles)
  ) {
    redirect("/communaute?error=space-not-allowed");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("community_replies").insert({
    thread_id: threadId,
    author_id: user.id,
    body,
    is_anonymous: isAnonymous,
  });

  if (error) {
    console.error("[postReply] insert failed", error.message);
    redirect(`/communaute/${spaceSlug}/${threadId}?error=reply-failed`);
  }

  const { data: existingReplies } = await supabase
    .from("community_replies")
    .select("author_id")
    .eq("thread_id", threadId);

  const recipientIds = Array.from(
    new Set([
      threadContext.createdBy,
      ...((existingReplies ?? []).map((reply) => reply.author_id as string)),
    ].filter((candidate): candidate is string => Boolean(candidate && candidate !== user.id)))
  );

  await notifyManyUsers(
    recipientIds.map((recipientId) => ({
      userId: recipientId,
      kind: "community_reply" as const,
      title: "Nouvelle réponse dans la communauté",
      body: threadContext.threadTitle || "Un sujet que vous suivez a reçu une réponse.",
      href: `/communaute/${threadContext.spaceSlug}/${threadId}`,
    }))
  );

  revalidatePath(`/communaute/${threadContext.spaceSlug}`);
  revalidatePath(`/communaute/${threadContext.spaceSlug}/${threadId}`);
  redirect(`/communaute/${threadContext.spaceSlug}/${threadId}?status=reply-posted`);
}
