import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuditEntry = {
  actionType: string;
  targetKind: string;
  targetId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function recordAdminAudit({
  actionType,
  targetKind,
  targetId,
  summary,
  metadata,
}: AuditEntry) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("admin_audit_logs").insert({
    actor_id: user.id,
    action_type: actionType,
    target_kind: targetKind,
    target_id: targetId ?? null,
    summary,
    metadata: metadata ?? {},
  });
}
