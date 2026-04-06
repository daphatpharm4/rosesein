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
  const shouldLoadUserContext =
    currentPath === "/" ||
    currentPath === "/messages" ||
    currentPath === "/parcours" ||
    currentPath === "/communaute" ||
    currentPath === "/admin" ||
    currentPath === "/parametres";
  const context = shouldLoadUserContext ? await getCurrentUserContext() : null;
  const difficultDayMode = context?.profile?.difficultDayMode ?? false;

  return (
    <div className={`min-h-screen ${difficultDayMode ? "bg-primary/5" : ""}`}>
      <TopAppBar title={title} />
      <main
        className={`mx-auto flex min-h-screen w-full flex-col pb-40 ${
          difficultDayMode
            ? "max-w-screen-sm gap-6 px-4 pt-32"
            : "max-w-screen-md px-5 pt-28"
        }`}
      >
        {difficultDayMode ? (
          <div className="surface-card bg-secondary-container text-on-secondary-container">
            <p className="font-headline text-base font-semibold">Mode journee difficile active</p>
            <p className="mt-2 text-sm leading-7">
              L&apos;interface va a l&apos;essentiel. Si vous avez besoin d&apos;un soutien
              rapide, le bouton d&apos;aide reste visible.
            </p>
          </div>
        ) : null}
        {children}
      </main>
      {currentPath !== "/aide" ? (
        <Link
          href={"/aide" as Route}
          className="fixed bottom-28 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-3 font-label text-sm font-semibold text-primary shadow-ambient"
        >
          Besoin d&apos;aide
        </Link>
      ) : null}
      {floatingAction}
      <BottomNav currentPath={currentPath} />
    </div>
  );
}
