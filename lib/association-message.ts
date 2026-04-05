// lib/association-message.ts
import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export type AssociationMessage = {
  id: string;
  title: string;
  body: string;
  expiresAt: string;
  createdAt: string;
};

export async function getActiveAssociationMessage(): Promise<AssociationMessage | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = createSupabasePublicClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("association_messages")
    .select("id, title, body, expires_at, created_at")
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    title: data.title as string,
    body: data.body as string,
    expiresAt: data.expires_at as string,
    createdAt: data.created_at as string,
  };
}
