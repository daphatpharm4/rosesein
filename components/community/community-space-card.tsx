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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-container text-on-sage">
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <span className="self-start rounded-full bg-secondary-container px-3 py-1 font-label text-xs font-semibold text-on-secondary-container">
          {KIND_LABELS[space.allowedKind] ?? space.allowedKind}
        </span>
      </div>
      <div>
        <h2 className="type-card-title text-on-surface">{space.title}</h2>
        <p className="type-body mt-2 text-on-surface-variant">{space.description}</p>
        <p className="type-meta mt-2 text-outline">
          {space.threadCount} fil{space.threadCount !== 1 ? "s" : ""}
        </p>
      </div>
      <span className="type-action inline-flex items-center gap-2 text-primary">
        Entrer dans l&apos;espace
        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.8} />
      </span>
    </Link>
  );
}
