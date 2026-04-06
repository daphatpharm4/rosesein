import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { makeEmptyPayload } from "@/lib/community-reactions";
import { getThreadWithReplies, getThreadReactionsMap, getReplyReactionsMap } from "@/lib/communaute";
import { ReactionBar } from "@/components/community/reaction-bar";
import { postReply } from "./actions";
import { toggleThreadReaction, toggleReplyReaction } from "../../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ spaceSlug: string; threadId: string }> };
type ThreadPageProps = Props & {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "body-required": "Ajoutez au moins quelques mots avant d'envoyer votre réponse.",
  "reply-failed": "La réponse n'a pas pu être enregistrée.",
  "reply-posted": "Votre réponse a été publiée.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { threadId } = await params;
  const result = await getThreadWithReplies(threadId);
  if (!result) return { title: "Fil introuvable" };
  return { title: result.thread.title };
}

function formatRelativeDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ThreadPage({ params, searchParams }: ThreadPageProps) {
  const query = (await searchParams) ?? {};
  const { spaceSlug, threadId } = await params;
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const result = await getThreadWithReplies(threadId);

  if (!result) notFound();

  const { thread, replies } = result;

  const replyIds = replies.map((r) => r.id);
  const [threadReactionsMap, replyReactionsMap] = await Promise.all([
    getThreadReactionsMap([threadId]),
    getReplyReactionsMap(replyIds),
  ]);

  const threadToggle = toggleThreadReaction.bind(null, threadId);

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <Link
          href={`/communaute/${spaceSlug}` as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour à {thread.spaceTitle}
        </Link>

        {(status || error) && feedbackMap[(error ?? status) as string] ? (
          <div
            className={`surface-card ${
              error ? "bg-primary/10 text-on-primary-container" : "bg-secondary-container text-on-secondary-container"
            }`}
          >
            <p className="font-headline text-base font-semibold">Communauté</p>
            <p className="mt-2 text-sm leading-7">{feedbackMap[(error ?? status) as string]}</p>
          </div>
        ) : null}

        {/* Thread body */}
        <div className="surface-section space-y-3">
          <div className="eyebrow">{thread.spaceTitle}</div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">{thread.title}</h1>
          <p className="text-base leading-8 text-on-surface-variant">{thread.body}</p>
          <ReactionBar
            initialPayload={threadReactionsMap[threadId] ?? makeEmptyPayload()}
            onToggle={threadToggle}
          />
        </div>

        {/* Replies */}
        <section className="space-y-4">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            {replies.length} réponse{replies.length !== 1 ? "s" : ""}
          </h2>

          {replies.map((reply) => {
            const replyToggle = toggleReplyReaction.bind(null, reply.id);
            return (
              <article key={reply.id} className="surface-card space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-label text-sm font-semibold text-on-surface">
                    {reply.authorDisplayName}
                  </p>
                  <time className="font-label text-xs text-outline">
                    {formatRelativeDate(reply.createdAt)}
                  </time>
                </div>
                <p className="text-sm leading-7 text-on-surface-variant">{reply.body}</p>
                <ReactionBar
                  initialPayload={replyReactionsMap[reply.id] ?? makeEmptyPayload()}
                  onToggle={replyToggle}
                />
              </article>
            );
          })}

          {/* Reply form */}
          <section className="surface-section space-y-4">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Ajouter une réponse
            </h2>
            <form action={postReply} className="space-y-4">
              <input type="hidden" name="threadId" value={threadId} />
              <input type="hidden" name="spaceSlug" value={spaceSlug} />
              <textarea
                name="body"
                required
                minLength={2}
                rows={4}
                placeholder="Partagez votre pensée avec bienveillance…"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm leading-7 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 font-label text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                  />
                  Répondre anonymement
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-primary px-5 py-2.5 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </section>
        </section>
      </section>
    </AppShell>
  );
}
