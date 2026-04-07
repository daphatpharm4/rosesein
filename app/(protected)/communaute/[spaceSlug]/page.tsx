import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle, Pin } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { makeEmptyPayload } from "@/lib/community-reactions";
import { getSpaceWithThreads, getThreadReactionsMap } from "@/lib/communaute";
import { ReactionBar } from "@/components/community/reaction-bar";
import { toggleThreadReaction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ spaceSlug: string }> };
type SpacePageProps = Props & {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "thread-created": "Votre sujet a été publié dans cet espace.",
  "space-not-allowed": "Votre profil actuel ne peut pas publier dans cet espace.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { spaceSlug } = await params;
  const result = await getSpaceWithThreads(spaceSlug);
  if (!result) return { title: "Espace introuvable" };
  return { title: result.space.title };
}

export default async function SpacePage({ params, searchParams }: SpacePageProps) {
  const { spaceSlug } = await params;
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const feedbackKey = error ?? status;
  const result = await getSpaceWithThreads(spaceSlug);

  if (!result) notFound();

  const { space, threads } = result;

  const threadIds = threads.map((t) => t.id);
  const reactionsMap = await getThreadReactionsMap(threadIds);

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

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/communaute/${spaceSlug}/nouveau` as Route}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
          >
            Ouvrir un sujet
          </Link>
          <div className="rounded-full bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            Charte de bienveillance active dans tout l&apos;espace.
          </div>
        </div>

        {feedbackKey && feedbackMap[feedbackKey] ? (
          <div
            className={`surface-card ${
              error ? "bg-primary/10 text-on-primary-container" : "bg-secondary-container text-on-secondary-container"
            }`}
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
          >
            <p className="font-headline text-base font-semibold">Communauté</p>
            <p className="mt-2 text-sm leading-7">{feedbackMap[feedbackKey]}</p>
          </div>
        ) : null}

        {threads.length > 0 ? (
          <div className="space-y-4">
            {threads.map((thread) => {
              const toggle = toggleThreadReaction.bind(null, thread.id);
              return (
                <article key={thread.id} className="surface-card space-y-3">
                  <Link
                    href={`/communaute/${spaceSlug}/${thread.id}` as Route}
                    className="group flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {thread.pinned && (
                          <Pin
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 text-primary"
                            strokeWidth={2}
                          />
                        )}
                        <h2 className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                          {thread.title}
                        </h2>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-on-surface-variant">
                        {thread.body}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="flex items-center gap-1 font-label text-xs text-outline">
                          <MessageCircle
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                            strokeWidth={1.8}
                          />
                          {thread.replyCount} réponse
                          {thread.replyCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-outline transition-colors group-hover:text-primary"
                      strokeWidth={1.8}
                    />
                  </Link>

                  <ReactionBar
                    initialPayload={reactionsMap[thread.id] ?? makeEmptyPayload()}
                    onToggle={toggle}
                  />
                </article>
              );
            })}
          </div>
        ) : (
          <div className="surface-section text-center">
            <p className="text-base text-on-surface-variant">
              Aucun fil de discussion pour le moment.
            </p>
            <p className="mt-2 text-sm text-outline">
              Ouvrez le premier sujet de cet espace pour lancer l&apos;échange.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
