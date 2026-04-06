import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Newspaper } from "lucide-react";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ArticleContent } from "@/components/content/article-content";
import { formatPublishedDate, getArticleBySlug } from "@/lib/content";

export const revalidate = 300;

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article introuvable" };
  return { title: article.title, description: article.summary };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <AppShell title="Actualités" currentPath="/actualites">
      <section className="space-y-6">
        <Link
          href="/actualites"
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour aux actualités
        </Link>

        <div className="surface-section space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Newspaper aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="eyebrow">{article.category}</p>
          </div>
          <h1 className="editorial-title">{article.title}</h1>
          <p className="text-base leading-7 text-on-surface-variant">{article.summary}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-outline">
            Publié le {formatPublishedDate(article.publishedAt)}
          </p>
        </div>

        {article.content.length > 0 && (
          <div className="surface-card">
            <ArticleContent blocks={article.content} />
          </div>
        )}
      </section>
    </AppShell>
  );
}
