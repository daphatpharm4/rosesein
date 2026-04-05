import Link from "next/link";
import { ArrowRight, Heart, HandHeart, MessageCircleHeart, Sparkles, Users } from "lucide-react";
import type { Route } from "next";
import type { CommunitySpace } from "@/lib/communaute";

const ICON_MAP: Record<string, typeof Users> = {
  Heart, HandHeart, MessageCircleHeart, Sparkles, Users,
};

const KIND_LABELS: Record<string, string> = {
  patient: "Patientes",
  caregiver: "Aidants",
  all: "Ouvert à tous",
};

type Props = { space: CommunitySpace };

export function CommunitySpaceCard({ space }: Props) {
  const Icon = ICON_MAP[space.iconName] ?? Users;

  return (
    <Link href={`/communaute/${space.slug}` as Route} className="surface-card group space-y-4 block">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <span className="rounded-full bg-secondary-container px-3 py-1 font-label text-xs font-semibold text-on-secondary-container">
          {KIND_LABELS[space.allowedKind] ?? space.allowedKind}
        </span>
      </div>
      <div>
        <h2 className="font-headline text-lg font-semibold text-on-surface">{space.title}</h2>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">{space.description}</p>
        <p className="mt-2 font-label text-xs font-semibold uppercase tracking-[0.16em] text-outline">
          {space.threadCount} fil{space.threadCount !== 1 ? "s" : ""}
        </p>
      </div>
      <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
        Entrer dans l&apos;espace
        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.8} />
      </span>
    </Link>
  );
}
