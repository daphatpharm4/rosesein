// components/navigation/top-app-bar.tsx
import Link from "next/link";
import { LifeBuoy, Settings2 } from "lucide-react";
import { Suspense } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";

type TopAppBarProps = {
  title?: string;
};

export function TopAppBar({ title }: TopAppBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 mx-auto max-w-screen-md px-4 pt-4">
      <div className="glass-panel rounded-brand-xl flex items-center justify-between px-5 py-3 shadow-ambient">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary font-headline text-sm font-bold text-on-primary">
            RS
          </div>
          <div>
            <p className="font-label text-xs uppercase tracking-[0.16em] text-primary">
              ROSE-SEIN
            </p>
            <p className="font-headline text-sm font-semibold text-on-surface">
              {title ?? "Digital Sanctuary"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low" />
          }>
            <NotificationBell />
          </Suspense>
          <Link
            href="/aide"
            aria-label="Ouvrir l'aide"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <LifeBuoy aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <Link
            href="/account"
            aria-label="Ouvrir le compte"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Settings2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  );
}
