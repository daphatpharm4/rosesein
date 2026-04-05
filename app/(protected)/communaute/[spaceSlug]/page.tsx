import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle, Pin } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { getSpaceWithThreads } from "@/lib/communaute";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ spaceSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { spaceSlug } = await params;
  const result = await getSpaceWithThreads(spaceSlug);
  if (!result) return { title: "Espace introuvable" };
  return { title: result.space.title };
}

export default async function SpacePage({ params }: Props) {
  const { spaceSlug } = await params;
  const result = await getSpaceWithThreads(spaceSlug);

  if (!result) notFound();

  const { space, threads } = result;

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <Link
          href={"/communaute" as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Tous les espaces
        </Link>

        <div className="space-y-2">
          <div className="eyebrow">Espace communauté</div>
          <h1 className="editorial-title">{space.title}</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            {space.description}
          </p>
        </div>

        {threads.length > 0 ? (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/communaute/${spaceSlug}/${thread.id}` as Route}
                className="surface-card group flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {thread.pinned && (
                      <Pin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                    )}
                    <p className="font-headline text-base font-semibold text-on-surface">
                      {thread.title}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-7 text-on-surface-variant">
                    {thread.body}
                  </p>
                  <div className="mt-2 flex items-center gap-1 font-label text-xs text-outline">
                    <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {thread.replyCount} réponse{thread.replyCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-outline transition-transform group-hover:translate-x-1"
                  strokeWidth={1.8}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Aucun fil pour le moment
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              L&apos;équipe prépare les premiers sujets de discussion.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
