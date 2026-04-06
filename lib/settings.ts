import type { PlatformRole, UserProfile } from "@/lib/auth";
import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationPreferences = {
  messagesEnabled: boolean;
  repliesEnabled: boolean;
  newsEnabled: boolean;
  eventsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
};

export type SettingsSnapshot = {
  email: string | null;
  profile: UserProfile;
  roles: PlatformRole[];
  notificationPreferences: NotificationPreferences;
};

const defaultNotificationPreferences: NotificationPreferences = {
  messagesEnabled: true,
  repliesEnabled: true,
  newsEnabled: true,
  eventsEnabled: true,
  emailEnabled: false,
  pushEnabled: false,
};

export async function getSettingsSnapshot(): Promise<SettingsSnapshot> {
  const { user, profile, roles } = await requireCompletedProfile("/parametres");
  const supabase = await createSupabaseServerClient();
  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("messages_enabled, replies_enabled, news_enabled, events_enabled, email_enabled, push_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    throw new Error("Profile is required before loading settings.");
  }

  return {
    email: user.email ?? null,
    profile,
    roles,
    notificationPreferences: preferences
      ? {
          messagesEnabled: preferences.messages_enabled,
          repliesEnabled: preferences.replies_enabled,
          newsEnabled: preferences.news_enabled,
          eventsEnabled: preferences.events_enabled,
          emailEnabled: preferences.email_enabled ?? false,
          pushEnabled: preferences.push_enabled ?? false,
        }
      : defaultNotificationPreferences,
  };
}
