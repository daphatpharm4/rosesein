import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ArticleContent } from "@/components/content/article-content";
import {
  getResourceById,
  getCategoryLabel,
  isResourceCategory,
  formatDifficulty,
  formatFormat,
} from "@/lib/soins";

export const revalidate = 300;

type Props = { params: Promise<{ category: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resource = await getResourceById(id);
  if (!resource) return { title: "Ressource introuvable" };
  return { title: resource.title, description: resource.summary };
}

export default async function ResourceDetailPage({ params }: Props) {
  const { category, id } = await params;

  if (!isResourceCategory(category)) notFound();

  const resource = await getResourceById(id);
  if (!resource) notFound();

  return (
    <AppShell title="Soins de support" currentPath="/soins">
      <section className="space-y-6">
        <Link
          href={`/soins/${category}` as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour à {getCategoryLabel(category)}
        </Link>

        <div className="surface-section space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">{getCategoryLabel(resource.category)}</p>
            <span className="rounded-full bg-secondary-container px-3 py-1 font-label text-xs font-semibold text-on-secondary-container">
              {formatFormat(resource.format)}
            </span>
            <span className="rounded-full bg-surface-container-high px-3 py-1 font-label text-xs font-semibold text-on-surface-variant">
              {formatDifficulty(resource.difficulty)}
            </span>
          </div>
          <h1 className="editorial-title">{resource.title}</h1>
          <p className="text-base leading-7 text-on-surface-variant">{resource.summary}</p>
        </div>

        {resource.content.length > 0 && (
          <div className="surface-card">
            <ArticleContent blocks={resource.content} />
          </div>
        )}
      </section>
    </AppShell>
  );
}
