"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function publishAssociationMessage(formData: FormData): Promise<void> {
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const expiresAtRaw = (formData.get("expires_at") as string | null)?.trim() ?? "";

  if (!title) redirect("/admin/message-association?error=title-required" as Route);
  if (body.length < 10) redirect("/admin/message-association?error=body-too-short" as Route);
  if (!expiresAtRaw) redirect("/admin/message-association?error=expiry-required" as Route);

  const todayUtc = new Date().toISOString().split("T")[0]!;
  if (expiresAtRaw <= todayUtc) redirect("/admin/message-association?error=expiry-past" as Route);

  const { user } = await requireStaff("/admin/message-association");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("association_messages").insert({
    title,
    body,
    expires_at: new Date(expiresAtRaw + "T00:00:00.000Z").toISOString(),
    created_by: user.id,
  });

  if (error) redirect("/admin/message-association?error=publish-failed" as Route);

  revalidatePath("/", "layout");
  redirect("/admin/message-association" as Route);
}
