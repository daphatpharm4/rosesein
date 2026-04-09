"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CalendarRange, ExternalLink, Newspaper, Search, ShieldCheck } from "lucide-react";

import { EventKindBadge } from "@/components/content/event-kind-badge";
import type { PublishedArticle, PublishedEvent } from "@/lib/content";
import { formatEventSchedule, formatPublishedDate } from "@/lib/content";

type Props = {
  articles: PublishedArticle[];
  events: PublishedEvent[];
  configured: boolean;
};

export function NewsFilters({ articles, events, configured }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const activeCategory = searchParams.get("cat") ?? "Tout";

  const allCategories = ["Tout", ...Array.from(new Set(articles.map((a) => a.category))).sort()];

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      search.trim() === "" ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Tout" || a.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <label htmlFor="news-search" className="sr-only">
          Rechercher dans les actualités
        </label>
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
          strokeWidth={1.8}
        />
        <input
          id="news-search"
          type="search"
          placeholder="Rechercher un sujet..."
          value={search}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) {
              params.set("q", e.target.value);
            } else {
              params.delete("q");
            }
            router.push(`?${params.toString()}`, { scroll: false });
          }}
          className="w-full rounded-brand bg-surface-container-high py-4 pl-11 pr-4 text-sm text-on-surface placeholder:text-outline"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {allCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              if (cat === "Tout") {
                params.delete("cat");
              } else {
                params.set("cat", cat);
              }
              params.delete("q"); // reset search when changing category
              router.push(`?${params.toString()}`, { scroll: false });
            }}
            className={`rounded-full px-4 py-2 font-label text-sm font-semibold transition-colors ${
              activeCategory === cat
                ? "bg-gradient-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div>
        <div className="eyebrow mb-3">Articles</div>
        {filteredArticles.length > 0 ? (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <article key={article.id} className="surface-card space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Newspaper aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <p className="eyebrow">{article.category}</p>
                </div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  {article.title}
                </h2>
                <p className="text-sm leading-7 text-on-surface-variant">{article.summary}</p>
                <div className="flex items-center justify-between">
                  <p className="font-label text-xs uppercase tracking-[0.16em] text-outline">
                    {formatPublishedDate(article.publishedAt)}
                  </p>
                  <Link
                    href={`/actualites/${article.slug}` as Route}
                    className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                  >
                    Lire
                    <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-base font-semibold text-on-surface">
              Aucun article pour cette recherche
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Essayez un autre terme ou retirez le filtre de catégorie.
            </p>
          </div>
        )}
      </div>

      {/* Events */}
      {events.length > 0 && (
        <div>
          <div className="eyebrow mb-2">Rendez-vous publiés</div>
          <p className="mb-4 max-w-2xl text-base leading-8 text-on-surface-variant">
            Événements associatifs, ateliers et webinaires se retrouvent ici avec une page
            de détail propre à chaque format.
          </p>
          <div className="space-y-4">
            {events.map((event) => (
              <article key={event.id} className="surface-card space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <CalendarRange aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <EventKindBadge kind={event.eventKind} />
                  {event.hostProfessionalName ? (
                    <span className="text-sm text-on-surface-variant">
                      Animé par {event.hostProfessionalName}
                    </span>
                  ) : null}
                </div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  {event.title}
                </h2>
                <p className="text-sm leading-7 text-on-surface-variant">{event.description}</p>
                <p className="font-label text-xs uppercase tracking-[0.16em] text-outline">
                  {formatEventSchedule(event)}
                  {event.locationLabel ? ` · ${event.locationLabel}` : ""}
                </p>
                <div className="flex justify-end">
                  <Link
                    href={`/actualites/evenements/${event.id}` as Route}
                    className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                  >
                    Voir le détail
                    <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {configured && (
        <div className="surface-section">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface">
                Contenus validés par l&apos;association
              </p>
              <a
                href="https://rosesein.org/"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
              >
                Voir le site institutionnel
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
