import { getNotificationSummary, markAllNotificationsRead } from "@/lib/notifications";
import { NotificationBellClient } from "@/components/notifications/notification-bell-client";

export async function NotificationBell() {
  const { notifications, unreadCount } = await getNotificationSummary();

  return (
    <NotificationBellClient
      notifications={notifications}
      unreadCount={unreadCount}
      markAllAction={markAllNotificationsRead}
    />
  );
}
