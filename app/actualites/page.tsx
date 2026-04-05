import { AppShell } from "@/components/shell/app-shell";
import { getPublicContentSnapshot } from "@/lib/content";
import { NewsFilters } from "@/components/content/news-filters";

export const revalidate = 300;

export default async function NewsPage() {
  const { configured, articles, events } = await getPublicContentSnapshot();

  return (
    <AppShell title="Actualités" currentPath="/actualites">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Editorial et orientation</div>
          <h1 className="editorial-title">Des contenus clairs, fiables et sereins.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Retrouvez les articles et événements publiés par l&apos;association.
            Filtrez par catégorie ou recherchez un sujet.
          </p>
        </div>

        <NewsFilters articles={articles} events={events} configured={configured} />
      </section>
    </AppShell>
  );
}
