// components/navigation/bottom-nav.tsx
import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, HeartPulse, MessageCircleMore, Users } from "lucide-react";

const navItems = [
  {
    href: "/" as Route,
    label: "Accueil",
    icon: HeartPulse,
  },
  {
    href: "/communaute" as Route,
    label: "Communauté",
    icon: Users,
  },
  {
    href: "/messages" as Route,
    label: "Messages",
    icon: MessageCircleMore,
  },
  {
    href: "/parcours" as Route,
    label: "Parcours",
    icon: CalendarDays,
  },
];

type BottomNavProps = {
  currentPath: string;
};

export function BottomNav({ currentPath }: BottomNavProps) {
  const isActive = (href: string) =>
    currentPath === href || (href !== "/" && currentPath.startsWith(href));

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-screen-md px-3 pb-[max(var(--safe-area-bottom),0.75rem)] sm:px-4 sm:pb-4"
    >
      <div className="shell-bar grid grid-cols-4 gap-1.5 rounded-[2rem] border border-outline-variant/25 bg-background/92 px-2 py-2 shadow-ambient backdrop-blur-sm sm:rounded-brand-xl sm:px-3 sm:py-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`bottom-nav-item flex min-h-[3.5rem] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.25rem] px-2 py-2 text-center sm:min-w-16 sm:rounded-full sm:px-4 ${
              isActive(href)
                ? "bg-surface-container-low text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low/70 hover:text-on-surface"
            }`}
          >
            <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            <span className="truncate font-label text-[0.68rem] font-semibold leading-none sm:text-[11px]">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
