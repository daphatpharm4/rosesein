import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Route } from "next";
import { ArrowRight, MapPinned } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { ResourceCard } from "@/components/content/resource-card";
import { getSupportDirectoryEntries } from "@/lib/support-directory";
import {
  getResourcesByCategory,
  getCategoryLabel,
  getCategoryDescription,
  isResourceCategory,
} from "@/lib/soins";

export const revalidate = 300;

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isResourceCategory(category)) return { title: "Catégorie introuvable" };
  return { title: getCategoryLabel(category), description: getCategoryDescription(category) };
}

export default async function SoinsCategoryPage({ params }: Props) {
  const { category } = await params;

  if (!isResourceCategory(category)) notFound();

  const resources = await getResourcesByCategory(category);
  const directoryEntries = getSupportDirectoryEntries(category);

  return (
    <AppShell title="Soins de support" currentPath="/soins">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Soins de support</div>
          <h1 className="editorial-title">{getCategoryLabel(category)}</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            {getCategoryDescription(category)}
          </p>
        </div>

        {resources.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Aucune ressource disponible pour le moment
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              L&apos;équipe éditoriale prépare des contenus pour cet espace.
            </p>
          </div>
        )}

        <section className="space-y-4">
          <div>
            <div className="eyebrow">Annuaire & ateliers</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Reperes concrets a mobiliser
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {directoryEntries.map((entry) => (
              <article key={`${entry.title}-${entry.location}`} className="surface-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <MapPinned aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 font-headline text-lg font-semibold text-on-surface">
                  {entry.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  {entry.subtitle}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-outline">
                  {entry.location}
                </p>
                {entry.href ? (
                  <Link
                    href={entry.href as Route}
                    className="mt-4 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                  >
                    Ouvrir
                    <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
