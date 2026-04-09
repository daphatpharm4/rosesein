import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";

import { ProfessionalCard } from "@/components/pro/professional-card";
import { AppShell } from "@/components/shell/app-shell";
import { getProfessionalDirectory, type ProfessionalKind } from "@/lib/professional";

export const metadata: Metadata = {
  title: "Annuaire des professionnels",
  description:
    "Trouver un professionnel de santé ou un spécialiste des soins de support engagé auprès des patientes ROSE-SEIN.",
};

export const dynamic = "force-dynamic";

type ProfessionalDirectoryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfessionalDirectoryPage({
  searchParams,
}: ProfessionalDirectoryPageProps) {
  const query = (await searchParams) ?? {};
  const parcours = firstValue(query.parcours);
  const kind: ProfessionalKind | undefined =
    parcours === "medical" || parcours === "support_care" ? parcours : undefined;
  const professionals = await getProfessionalDirectory({ kind });
  const featuredCount = professionals.filter((professional) => professional.subscriptionTier === "partenaire").length;

  const filters = [
    { href: "/professionnels", label: "Tous", active: !kind },
    { href: "/professionnels?parcours=medical", label: "Parcours médical", active: kind === "medical" },
    {
      href: "/professionnels?parcours=support_care",
      label: "Soins de support",
      active: kind === "support_care",
    },
  ];

  return (
    <AppShell title="Professionnels" currentPath="/professionnels">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Annuaire professionnel</div>
          <h1 className="editorial-title">Trouver un accompagnement fiable, humain et lisible.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            ROSE-SEIN réunit des professionnels de santé et des spécialistes du soin de
            support avec une logique simple: comprendre rapidement le parcours, les modalités
            de consultation et la disponibilité avant de contacter.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href as Route}
              className={`rounded-full px-4 py-2.5 font-label text-sm font-semibold transition-colors ${
                filter.active
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-lowest text-on-surface-variant shadow-ambient hover:text-on-surface"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {featuredCount > 0 ? (
          <div className="surface-card bg-secondary-container/25">
            <p className="font-headline text-lg font-semibold text-on-surface">
              {featuredCount} fiche(s) partenaire mise(s) en avant
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Les comptes partenaires apparaissent en tête de l&apos;annuaire avec un signal visuel renforcé. Cette mise en avant reste éditoriale et ne constitue pas un avis médical individualisé.
            </p>
          </div>
        ) : null}

        {professionals.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {professionals.map((professional) => (
              <ProfessionalCard key={professional.id} profile={professional} />
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Aucun professionnel visible pour ce filtre
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              L&apos;annuaire s&apos;enrichit progressivement. Revenez bientôt ou élargissez le filtre pour consulter toutes les fiches actives.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
