import type { ComponentProps } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  label: string;
};

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-primary shadow-ambient transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );
}
