// components/navigation/top-app-bar.tsx
import Link from "next/link";
import { LifeBuoy, UserRound } from "lucide-react";
import { Suspense } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";

type TopAppBarProps = {
  title?: string;
};

export function TopAppBar({ title }: TopAppBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 mx-auto max-w-screen-md px-4 pt-3">
      <div className="flex items-center justify-between rounded-brand-xl border border-outline-variant/25 bg-background/90 px-5 py-3 shadow-ambient backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary font-headline text-sm font-bold text-on-primary">
            RS
          </div>
          <div>
            <p className="font-label text-xs uppercase tracking-[0.16em] text-primary">
              ROSE-SEIN
            </p>
            <p className="font-headline text-sm font-semibold text-on-surface">
              {title ?? "Accueil"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Suspense
            fallback={
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low" />
            }
          >
            <NotificationBell />
          </Suspense>
          <Link
            href="/aide"
            aria-label="Ouvrir l'aide"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low/80 text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <LifeBuoy aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <Link
            href="/account"
            aria-label="Ouvrir le compte"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low/80 text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  );
}
