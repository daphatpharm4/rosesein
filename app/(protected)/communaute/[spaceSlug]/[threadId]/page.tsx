import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { getThreadWithReplies } from "@/lib/communaute";
import { postReply } from "./actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ spaceSlug: string; threadId: string }> };

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

export default async function ThreadPage({ params }: Props) {
  const { spaceSlug, threadId } = await params;
  const result = await getThreadWithReplies(threadId);

  if (!result) notFound();

  const { thread, replies } = result;

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

        <div className="surface-section space-y-3">
          <div className="eyebrow">{thread.spaceTitle}</div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">{thread.title}</h1>
          <p className="text-base leading-8 text-on-surface-variant">{thread.body}</p>
        </div>

        <section className="space-y-4">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            {replies.length} réponse{replies.length !== 1 ? "s" : ""}
          </h2>

          {replies.map((reply) => (
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
            </article>
          ))}

          <section className="surface-section space-y-4">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Ajouter une réponse
            </h2>
            <form action={postReply} className="space-y-4">
              <input type="hidden" name="threadId" value={threadId} />
              <input type="hidden" name="spaceSlug" value={spaceSlug} />

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Votre message
                </span>
                <textarea
                  name="body"
                  rows={4}
                  required
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                  placeholder="Partagez votre expérience, vos questions ou votre soutien..."
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-sm text-on-surface-variant">
                  Répondre anonymement (votre nom ne sera pas affiché)
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
              >
                Publier la réponse
              </button>
            </form>
          </section>
        </section>
      </section>
    </AppShell>
  );
}
