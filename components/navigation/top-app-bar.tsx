// components/navigation/top-app-bar.tsx
import Link from "next/link";
import { LifeBuoy, Shield, UserRound } from "lucide-react";
import { Suspense } from "react";

import { RoseSeinLogo } from "@/components/branding/rose-sein-logo";
import { NotificationBell } from "@/components/notifications/notification-bell";

type TopAppBarProps = {
  title?: string;
  showAdminLink?: boolean;
  adminActive?: boolean;
  wide?: boolean;
};

export function TopAppBar({
  title,
  showAdminLink = false,
  adminActive = false,
  wide = false,
}: TopAppBarProps) {
  return (
    <header className={`fixed inset-x-0 top-0 z-50 mx-auto w-full px-3 pt-[max(var(--safe-area-top),0.75rem)] sm:px-4 ${wide ? "max-w-screen-lg" : "max-w-screen-md"}`}>
      <div className="shell-bar flex items-center justify-between gap-3 rounded-[2rem] border border-outline-variant/25 bg-background/90 px-3 py-2.5 shadow-ambient backdrop-blur-sm sm:rounded-brand-xl sm:px-5 sm:py-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            aria-label="Retour à l'accueil ROSE-SEIN"
            className="shrink-0 rounded-full"
          >
            <RoseSeinLogo compact />
          </Link>
          <div className="min-w-0">
            <p className="hidden font-label text-[0.63rem] uppercase tracking-[0.18em] text-secondary sm:block">
              Association de lutte contre le cancer du sein
            </p>
            <p className="truncate font-headline text-[0.95rem] font-semibold text-on-surface sm:text-sm">
              {title ?? "Accueil"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Suspense
            fallback={
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low sm:h-11 sm:w-11" />
            }
          >
            <NotificationBell />
          </Suspense>
          {showAdminLink ? (
            <Link
              href="/admin"
              aria-label="Ouvrir l'administration"
              className={`shell-action inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full px-0 font-label text-sm font-semibold sm:h-11 sm:min-w-11 sm:px-3 ${
                adminActive
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-low/80 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Shield aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          ) : null}
          <Link
            href="/aide"
            aria-label="Ouvrir l'aide"
            className="shell-action flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low/80 text-on-surface-variant hover:bg-surface-container sm:h-11 sm:w-11"
          >
            <LifeBuoy aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <Link
            href="/account"
            aria-label="Ouvrir le compte"
            className="shell-action flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low/80 text-on-surface-variant hover:bg-surface-container sm:h-11 sm:w-11"
          >
            <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  );
}
