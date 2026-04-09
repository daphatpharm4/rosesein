"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CalendarRange, MessageCircleMore, Newspaper, Users } from "lucide-react";

import type { AppNotification, NotificationKind } from "@/lib/notifications";

type NotificationBellClientProps = {
  notifications: AppNotification[];
  unreadCount: number;
  markAllAction: () => Promise<void>;
};

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

export function NotificationBellClient({
  notifications,
  unreadCount,
  markAllAction,
}: NotificationBellClientProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="shell-action relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container sm:h-11 sm:w-11"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} non lues` : ""}`}
        aria-expanded={open}
        aria-controls="notification-panel"
        aria-haspopup="dialog"
      >
        <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        {unreadCount > 0 ? (
          <span className="notification-unread-dot absolute right-2 top-2 flex h-2.5 w-2.5 rounded-full bg-primary" />
        ) : null}
      </button>

      {open ? (
        <div
          id="notification-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Notifications"
          className="notification-panel glass-panel fixed inset-x-3 top-[calc(var(--safe-area-top)+4.5rem)] z-50 rounded-brand-md shadow-ambient sm:absolute sm:right-0 sm:top-14 sm:w-80 sm:inset-x-auto"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <p className="font-headline text-sm font-semibold text-on-surface">Notifications</p>
            {unreadCount > 0 ? (
              <form action={markAllAction}>
                <button
                  type="submit"
                  className="min-h-11 rounded-full px-3 font-label text-xs font-semibold text-primary"
                >
                  Tout marquer comme lu
                </button>
              </form>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-on-surface-variant">Aucune notification.</p>
          ) : (
            <ul className="max-h-[min(24rem,calc(100dvh-var(--safe-area-top)-6rem))] divide-y divide-outline-variant/30 overflow-y-auto">
              {notifications.map((notif) => {
                const Icon = KIND_ICONS[notif.kind];
                const content = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-container-low ${
                      !notif.readAt ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-on-surface">{notif.title}</p>
                      {notif.body ? (
                        <p className="mt-0.5 break-words text-xs leading-5 text-on-surface-variant">
                          {notif.body}
                        </p>
                      ) : null}
                      <p className="mt-1 font-label text-[11px] text-outline">
                        {formatRelative(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li key={notif.id}>
                    {notif.href ? (
                      <a href={notif.href} className="block" onClick={() => setOpen(false)}>
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
