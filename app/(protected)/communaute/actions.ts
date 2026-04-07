"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompletedProfile } from "@/lib/auth";
import type { ReactionKind, ReactionsPayload } from "@/lib/community-reactions";
import { getReplyReactionPayload, getThreadReactionPayload } from "@/lib/communaute";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_KINDS = new Set<string>(["touche", "pense", "courage", "merci"]);

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function toggleThreadReaction(
  threadId: string,
  kind: ReactionKind
): Promise<ReactionsPayload> {
  if (!VALID_KINDS.has(kind)) throw new Error("Invalid reaction kind");
  const { user } = await requireCompletedProfile("/communaute");
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("community_thread_reactions")
    .select("kind")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.kind === kind) {
      const { error: deleteError } = await supabase
        .from("community_thread_reactions")
        .delete()
        .eq("thread_id", threadId)
        .eq("user_id", user.id);
      if (deleteError) throw new Error(deleteError.message);
    } else {
      const { error: updateError } = await supabase
        .from("community_thread_reactions")
        .update({ kind })
        .eq("thread_id", threadId)
        .eq("user_id", user.id);
      if (updateError) throw new Error(updateError.message);
    }
  } else {
    const { error: insertError } = await supabase
      .from("community_thread_reactions")
      .insert({ thread_id: threadId, user_id: user.id, kind });
    if (insertError) {
      console.error("[toggleThreadReaction] insert failed", insertError.message);
      throw new Error(insertError.message);
    }
  }

  revalidatePath("/communaute", "layout");
  return getThreadReactionPayload(threadId);
}

export async function toggleReplyReaction(
  replyId: string,
  kind: ReactionKind
): Promise<ReactionsPayload> {
  if (!VALID_KINDS.has(kind)) throw new Error("Invalid reaction kind");
  const { user } = await requireCompletedProfile("/communaute");
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("community_reply_reactions")
    .select("kind")
    .eq("reply_id", replyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.kind === kind) {
      const { error: deleteError } = await supabase
        .from("community_reply_reactions")
        .delete()
        .eq("reply_id", replyId)
        .eq("user_id", user.id);
      if (deleteError) throw new Error(deleteError.message);
    } else {
      const { error: updateError } = await supabase
        .from("community_reply_reactions")
        .update({ kind })
        .eq("reply_id", replyId)
        .eq("user_id", user.id);
      if (updateError) throw new Error(updateError.message);
    }
  } else {
    const { error: insertError } = await supabase
      .from("community_reply_reactions")
      .insert({ reply_id: replyId, user_id: user.id, kind });
    if (insertError) {
      console.error("[toggleReplyReaction] insert failed", insertError.message);
      throw new Error(insertError.message);
    }
  }

  revalidatePath("/communaute", "layout");
  return getReplyReactionPayload(replyId);
}

export async function createCommunityThread(formData: FormData) {
  const spaceSlug = normalizeText(formData.get("spaceSlug"));
  const title = normalizeText(formData.get("title"));
  const body = normalizeText(formData.get("body"));
  const isAnonymous = formData.get("isAnonymous") === "on";

  if (!spaceSlug || title.length < 4 || body.length < 8) {
    redirect(`/communaute/${spaceSlug || ""}/nouveau?error=thread-invalid`);
  }

  const { user, profile } = await requireCompletedProfile(`/communaute/${spaceSlug}/nouveau`);
  const supabase = await createSupabaseServerClient();
  const { data: space } = await supabase
    .from("community_spaces")
    .select("id, allowed_kind")
    .eq("slug", spaceSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!space) {
    redirect("/communaute?error=space-not-found");
  }

  if (!profile) {
    redirect(`/account?status=complete-profile&redirectTo=${encodeURIComponent(`/communaute/${spaceSlug}/nouveau`)}`);
  }

  if (space.allowed_kind !== "all" && profile.profileKind !== space.allowed_kind) {
    redirect(`/communaute/${spaceSlug}?error=space-not-allowed`);
  }

  const { error } = await supabase.from("community_threads").insert({
    space_id: space.id,
    title,
    body,
    created_by: user.id,
    is_anonymous: isAnonymous,
  });

  if (error) {
    console.error("[createCommunityThread] insert failed", error.message);
    redirect(`/communaute/${spaceSlug}/nouveau?error=thread-create-failed`);
  }

  revalidatePath("/communaute", "layout");
  redirect(`/communaute/${spaceSlug}?status=thread-created`);
}
