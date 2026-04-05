// lib/notifications.ts
"use server";

import { revalidatePath } from "next/cache";

import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type NotificationKind = "message" | "article" | "event" | "community_reply";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationSummary = {
  notifications: AppNotification[];
  unreadCount: number;
};

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getNotificationSummary(): Promise<NotificationSummary> {
  const empty: NotificationSummary = { notifications: [], unreadCount: 0 };
  if (!hasSupabaseBrowserEnv()) return empty;

  const { user } = await getCurrentUser();
  if (!user) return empty;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const notifications = ((data ?? []) as NotificationRow[]).map((row) => ({
    id: row.id,
    kind: row.kind as NotificationKind,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.readAt).length,
  };
}

export async function markAllNotificationsRead() {
  if (!hasSupabaseBrowserEnv()) return;

  const { user } = await getCurrentUser();
  if (!user) return;

  const supabase = await createSupabaseServerClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/", "layout");
}
