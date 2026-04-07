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
    <div className={`min-h-screen ${difficultDayMode ? "bg-primary/5" : ""}`}>
      <TopAppBar
        title={title}
        showAdminLink={hasStaffAccess}
        adminActive={currentPath.startsWith("/admin")}
      />
      <main
        id="main-content"
        className={`mx-auto flex min-h-screen w-full flex-col pb-32 ${
          difficultDayMode
            ? "max-w-screen-sm gap-6 px-4 pt-32"
            : "max-w-screen-md px-5 pt-28"
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
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={"/aide" as Route}
                className="rounded-full bg-surface-container-lowest px-4 py-2 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                Ouvrir l&apos;aide
              </Link>
              <Link
                href={"/messages" as Route}
                className="rounded-full bg-surface-container-lowest px-4 py-2 font-label text-sm font-semibold text-primary shadow-ambient"
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
