import Link from "next/link";
import { Building2, Globe, MapPin, Phone, Video } from "lucide-react";

import {
  CONSULTATION_MODE_LABELS,
  getProfessionalCategoryLabel,
  type ProfessionalProfile,
} from "@/lib/professional";

import { SubscriptionBadge } from "./subscription-badge";

export function ProfessionalCard({ profile }: { profile: ProfessionalProfile }) {
  const categoryLabel = getProfessionalCategoryLabel(profile);
  const primaryLabel = profile.structureName ?? `${profile.title ? `${profile.title} ` : ""}${profile.displayName}`.trim();
  const hasRemoteModes = profile.consultationModes.filter((mode) => mode !== "presentiel");

  return (
    <Link
      href={`/professionnels/${profile.slug}`}
      className="surface-card group block overflow-hidden transition-colors hover:border-primary/20 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="space-y-2">
            {profile.structureName ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary-container/50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-on-secondary-container">
                <Building2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                Structure de soins
              </div>
            ) : null}

            <div>
              <h3 className="font-headline text-lg font-semibold text-on-surface group-hover:text-primary">
                {primaryLabel}
              </h3>
              <p className="mt-1 text-sm font-medium text-primary">{categoryLabel}</p>
            </div>

            {profile.structureName ? (
              <p className="text-xs leading-6 text-on-surface-variant">
                Orientation assurée par la structure, avec prise de rendez-vous centralisée.
              </p>
            ) : null}
          </div>

          {profile.bio ? (
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              {profile.bio}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
            {profile.city ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                {profile.city}, {profile.country}
              </span>
            ) : null}

            {hasRemoteModes.map((mode) => (
              <span key={mode} className="inline-flex items-center gap-1.5">
                {mode === "visio" ? (
                  <Video aria-hidden="true" className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                ) : (
                  <Phone aria-hidden="true" className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                )}
                {CONSULTATION_MODE_LABELS[mode]}
              </span>
            ))}

            {profile.website ? (
              <span className="inline-flex items-center gap-1.5">
                <Globe aria-hidden="true" className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                Site web
              </span>
            ) : null}

            {profile.consultationPriceEur !== null ? (
              <span className="font-semibold text-on-surface">
                {profile.consultationPriceEur} €
              </span>
            ) : null}
          </div>
        </div>

        <SubscriptionBadge tier={profile.subscriptionTier} />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-outline-variant/20 pt-4">
        <p className="text-xs uppercase tracking-[0.16em] text-outline">
          {profile.subscriptionTier === "solidaire" ? "Contact direct" : "Agenda disponible"}
        </p>
        <span className="font-label text-sm font-semibold text-primary">Voir la fiche</span>
      </div>
    </Link>
  );
}
