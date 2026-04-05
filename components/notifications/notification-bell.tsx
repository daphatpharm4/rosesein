// components/notifications/notification-bell.tsx
import { Bell, CalendarRange, MessageCircleMore, Newspaper, Users } from "lucide-react";

import { getNotificationSummary, markAllNotificationsRead } from "@/lib/notifications";
import type { NotificationKind } from "@/lib/notifications";

const KIND_ICONS: Record<NotificationKind, typeof Bell> = {
  message: MessageCircleMore,
  article: Newspaper,
  event: CalendarRange,
  community_reply: Users,
};

function formatRelative(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

  if (diffDays > 0) return rtf.format(-diffDays, "day");
  if (diffHours > 0) return rtf.format(-diffHours, "hour");
  if (diffMins > 0) return rtf.format(-diffMins, "minute");
  return rtf.format(-diffSecs, "second");
}

export async function NotificationBell() {
  const { notifications, unreadCount } = await getNotificationSummary();

  return (
    <details className="relative">
      <summary
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} non lues` : ""}`}
      >
        <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary" />
        )}
      </summary>

      <div className="glass-panel absolute right-0 top-14 z-50 w-80 rounded-brand-md shadow-ambient">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-headline text-sm font-semibold text-on-surface">Notifications</p>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="font-label text-xs font-semibold text-primary"
              >
                Tout marquer comme lu
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-on-surface-variant">Aucune notification.</p>
        ) : (
          <ul className="max-h-80 divide-y divide-outline-variant/30 overflow-y-auto">
            {notifications.map((notif) => {
              const Icon = KIND_ICONS[notif.kind];
              const inner = (
                <li
                  className={`flex items-start gap-3 px-4 py-3 ${!notif.readAt ? "bg-primary/5" : ""}`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface">{notif.title}</p>
                    {notif.body && (
                      <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">{notif.body}</p>
                    )}
                    <p className="mt-1 font-label text-[11px] text-outline">
                      {formatRelative(notif.createdAt)}
                    </p>
                  </div>
                </li>
              );

              return notif.href ? (
                <a key={notif.id} href={notif.href} className="block hover:bg-surface-container-low">
                  {inner}
                </a>
              ) : (
                <div key={notif.id}>{inner}</div>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}
