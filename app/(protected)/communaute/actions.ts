"use server";

import { revalidatePath } from "next/cache";

import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReactionKind } from "@/lib/communaute";

const VALID_KINDS = new Set<string>(["touche", "pense", "courage", "merci"]);

export async function toggleThreadReaction(
  threadId: string,
  kind: ReactionKind
): Promise<void> {
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
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/communaute", "layout");
}

export async function toggleReplyReaction(
  replyId: string,
  kind: ReactionKind
): Promise<void> {
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
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/communaute", "layout");
}
