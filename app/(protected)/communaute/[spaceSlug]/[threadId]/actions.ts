"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompletedProfile } from "@/lib/auth";
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

  const { user } = await requireCompletedProfile("/communaute");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("community_replies").insert({
    thread_id: threadId,
    author_id: user.id,
    body,
    is_anonymous: isAnonymous,
  });

  if (error) {
    redirect(`/communaute/${spaceSlug}/${threadId}?error=reply-failed`);
  }

  revalidatePath(`/communaute/${spaceSlug}/${threadId}`);
  redirect(`/communaute/${spaceSlug}/${threadId}`);
}
