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
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-screen-md px-4 pb-4"
    >
      <div className="shell-bar flex items-center justify-around rounded-brand-xl border border-outline-variant/25 bg-background/92 px-3 py-3 shadow-ambient backdrop-blur-sm">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`bottom-nav-item flex min-w-16 flex-col items-center gap-1 rounded-full px-4 py-2 text-center ${
              isActive(href)
                ? "bg-surface-container-low text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low/70 hover:text-on-surface"
            }`}
          >
            <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            <span className="font-label text-[11px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
