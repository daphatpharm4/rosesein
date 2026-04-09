import { SUBSCRIPTION_TIER_LABELS, type SubscriptionTier } from "@/lib/professional";

const tierClasses: Record<SubscriptionTier, string> = {
  solidaire:
    "bg-secondary-container/70 text-on-secondary-container border-secondary-container/80",
  visibilite_agenda: "bg-primary/10 text-primary border-primary/15",
  partenaire:
    "bg-gradient-to-r from-primary/10 to-primary-container/20 text-primary border-primary/15",
};

export function SubscriptionBadge({ tier }: { tier: SubscriptionTier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-label text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${tierClasses[tier]}`}
    >
      {SUBSCRIPTION_TIER_LABELS[tier]}
    </span>
  );
}
