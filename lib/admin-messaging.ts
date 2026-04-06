// lib/admin-messaging.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BroadcastSegment = "all" | "patient" | "caregiver";

export type AdminBroadcast = {
  id: string;
  subject: string;
  body: string;
  segment: BroadcastSegment;
  recipientCount: number;
  createdAt: string;
};

export type AdminGroup = {
  id: string;
  title: string;
  participantCount: number;
  createdAt: string;
};

export type AdminMessagingHistory = {
  broadcasts: AdminBroadcast[];
  groups: AdminGroup[];
};

export type MemberOption = {
  id: string;
  displayName: string;
  pseudonym: string | null;
  profileKind: "patient" | "caregiver";
};

export async function getAdminMessagingHistory(
  staffUserId: string,
): Promise<AdminMessagingHistory> {
  const supabase = await createSupabaseServerClient();

  const [{ data: broadcastRows }, { data: groupThreadRows }] = await Promise.all([
    supabase
      .from("admin_broadcasts")
      .select("id, subject, body, segment, recipient_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("conversation_threads")
      .select("id, title, created_at")
      .eq("kind", "group")
      .eq("is_official", true)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const groupIds = (groupThreadRows ?? []).map((t) => t.id as string);

  const { data: participantRows } =
    groupIds.length > 0
      ? await supabase
          .from("thread_participants")
          .select("thread_id")
          .in("thread_id", groupIds)
      : { data: [] };

  const countByThread = new Map<string, number>();
  for (const row of participantRows ?? []) {
    const tid = row.thread_id as string;
    countByThread.set(tid, (countByThread.get(tid) ?? 0) + 1);
  }

  const broadcasts: AdminBroadcast[] = (broadcastRows ?? []).map((row) => ({
    id: row.id as string,
    subject: row.subject as string,
    body: row.body as string,
    segment: row.segment as BroadcastSegment,
    recipientCount: row.recipient_count as number,
    createdAt: row.created_at as string,
  }));

  const groups: AdminGroup[] = (groupThreadRows ?? []).map((row) => ({
    id: row.id as string,
    title: (row.title as string | null) ?? "Groupe sans titre",
    participantCount: countByThread.get(row.id as string) ?? 0,
    createdAt: row.created_at as string,
  }));

  return { broadcasts, groups };
}

export async function getMemberList(): Promise<MemberOption[]> {
  const supabase = await createSupabaseServerClient();

  // Fetch all profiles plus their roles in one query
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, pseudonym, profile_kind, user_roles(role)")
    .order("display_name", { ascending: true });

  return (data ?? [])
    .filter((row) => {
      const roles = ((row.user_roles ?? []) as Array<{ role: string }>).map((r) => r.role);
      return !roles.includes("admin") && !roles.includes("moderator");
    })
    .map((row) => ({
      id: row.id as string,
      displayName: row.display_name as string,
      pseudonym: row.pseudonym as string | null,
      profileKind: row.profile_kind as "patient" | "caregiver",
    }));
}
