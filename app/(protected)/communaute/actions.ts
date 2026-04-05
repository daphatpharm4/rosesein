"use server";

import { revalidatePath } from "next/cache";

import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReactionKind } from "@/lib/communaute";

export async function toggleThreadReaction(
  threadId: string,
  kind: ReactionKind
): Promise<void> {
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
      await supabase
        .from("community_thread_reactions")
        .delete()
        .eq("thread_id", threadId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("community_thread_reactions")
        .update({ kind })
        .eq("thread_id", threadId)
        .eq("user_id", user.id);
    }
  } else {
    await supabase
      .from("community_thread_reactions")
      .insert({ thread_id: threadId, user_id: user.id, kind });
  }

  revalidatePath("/communaute", "layout");
}

export async function toggleReplyReaction(
  replyId: string,
  kind: ReactionKind
): Promise<void> {
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
      await supabase
        .from("community_reply_reactions")
        .delete()
        .eq("reply_id", replyId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("community_reply_reactions")
        .update({ kind })
        .eq("reply_id", replyId)
        .eq("user_id", user.id);
    }
  } else {
    await supabase
      .from("community_reply_reactions")
      .insert({ reply_id: replyId, user_id: user.id, kind });
  }

  revalidatePath("/communaute", "layout");
}
