import Link from "next/link";
import type { Route } from "next";

import { getCurrentUserContext } from "@/lib/auth";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { TopAppBar } from "@/components/navigation/top-app-bar";

type AppShellProps = {
  title?: string;
  currentPath: string;
  floatingAction?: React.ReactNode;
  children: React.ReactNode;
};

export async function AppShell({
  title,
  currentPath,
  floatingAction,
  children,
}: AppShellProps) {
  const context = await getCurrentUserContext();
  const difficultDayMode = context?.profile?.difficultDayMode ?? false;
  const hasStaffAccess =
    context?.roles.some((role) => role === "moderator" || role === "admin") ?? false;

  return (
    <div className={`min-h-dvh ${difficultDayMode ? "bg-primary/5" : ""}`}>
      <TopAppBar
        title={title}
        showAdminLink={hasStaffAccess}
        adminActive={currentPath.startsWith("/admin")}
      />
      <main
        id="main-content"
        className={`mx-auto flex min-h-dvh w-full flex-col ${
          difficultDayMode
            ? "max-w-screen-sm gap-5 px-4 pt-[calc(var(--safe-area-top)+5.75rem)] pb-[calc(var(--safe-area-bottom)+6.75rem)] sm:gap-6 sm:pt-[calc(var(--safe-area-top)+6.5rem)] sm:pb-32"
            : "max-w-screen-md gap-8 px-4 pt-[calc(var(--safe-area-top)+5.5rem)] pb-[calc(var(--safe-area-bottom)+6.75rem)] sm:px-5 sm:pt-[calc(var(--safe-area-top)+6.25rem)] sm:pb-32"
        }`}
      >
        {difficultDayMode ? (
          <div className="rounded-brand-xl bg-secondary-container px-5 py-5 text-on-secondary-container">
            <p className="font-headline text-base font-semibold">Mode journée difficile activé</p>
            <p className="mt-2 text-sm leading-7">
              L&apos;interface va à l&apos;essentiel. Gardez seulement deux repères: l&apos;aide
              si vous avez besoin d&apos;orientation, et vos messages si vous voulez joindre
              une personne de confiance.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={"/aide" as Route}
                className="rounded-full bg-surface-container-lowest px-4 py-3 text-center font-label text-sm font-semibold text-primary shadow-ambient sm:w-auto"
              >
                Ouvrir l&apos;aide
              </Link>
              <Link
                href={"/messages" as Route}
                className="rounded-full bg-surface-container-lowest px-4 py-3 text-center font-label text-sm font-semibold text-primary shadow-ambient sm:w-auto"
              >
                Lire mes messages
              </Link>
            </div>
          </div>
        ) : null}
        {children}
      </main>
      {floatingAction}
      <BottomNav currentPath={currentPath} />
    </div>
  );
}
