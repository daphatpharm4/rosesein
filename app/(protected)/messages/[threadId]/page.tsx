import Link from "next/link";
import { AlertTriangle, ArrowLeft, Building2, MessagesSquare, Send, Users } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { ThreadRealtimeProvider } from "@/components/chat/thread-realtime-provider";
import { createMessageReport, sendMessage } from "@/app/(protected)/messages/actions";
import { reportReasonOptions } from "@/lib/moderation";
import { getThreadById, getThreadLead } from "@/lib/messages";

export const dynamic = "force-dynamic";

type ThreadPageProps = {
  params: Promise<{
    threadId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "message-sent": "Votre message a été envoyé.",
  "message-required": "Écrivez un message avant de l'envoyer.",
  "message-send-failed":
    "Le message n'a pas pu être envoyé. Vérifiez vos droits sur cette conversation.",
  "report-created": "Le signalement a été transmis à l'équipe de modération.",
  "report-create-failed":
    "Le signalement n'a pas pu être enregistré. Vérifiez le message visé et réessayez.",
  "thread-not-found": "Cette conversation n'est pas accessible avec votre session actuelle.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function ThreadIcon({ kind }: { kind: "association" | "direct" | "group" }) {
  if (kind === "association") {
    return <Building2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />;
  }

  if (kind === "group") {
    return <Users aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />;
  }

  return <MessagesSquare aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />;
}

export default async function ThreadPage({ params, searchParams }: ThreadPageProps) {
  const { threadId } = await params;
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const feedbackKey = error ?? status;
  const feedback = feedbackKey ? feedbackMap[feedbackKey] : null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const thread = await getThreadById(threadId);

  return (
    <AppShell title="Messagerie" currentPath="/messages">
      <ThreadRealtimeProvider threadId={thread.id}>
        <section className="space-y-6">
          <Link
            href="/messages"
            className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            Retour à la boîte de réception
          </Link>

          <div className="surface-section">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ThreadIcon kind={thread.kind} />
              </div>
              <div className="space-y-2">
                <div className="eyebrow">{getThreadLead(thread)}</div>
                <h1 className="font-headline text-3xl font-bold text-on-surface">
                  {thread.name}
                </h1>
                <p className="text-sm leading-7 text-on-surface-variant">
                  {thread.participants
                    .map((participant) =>
                      participant.isCurrentUser
                        ? `${participant.visibleName} (vous)`
                        : participant.visibleName,
                    )
                    .join(" · ")}
                </p>
              </div>
            </div>
          </div>

          {feedback ? (
            <div className={`surface-card ${feedbackTone}`}>
              <p className="font-headline text-base font-semibold">Messagerie</p>
              <p className="mt-2 text-sm leading-7">{feedback}</p>
            </div>
          ) : null}

          <div className="space-y-4">
            {thread.messages.length > 0 ? (
              thread.messages.map((message) => (
                <article
                  key={message.id}
                  className={`flex ${
                    message.isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-xl space-y-3">
                    <div
                      className={`rounded-[1.5rem] px-5 py-4 ${
                        message.isCurrentUser
                          ? "bg-gradient-primary text-on-primary"
                          : "bg-surface-container-lowest text-on-surface shadow-ambient"
                      }`}
                    >
                      <p
                        className={`font-headline text-sm font-semibold ${
                          message.isCurrentUser ? "text-on-primary" : "text-on-surface"
                        }`}
                      >
                        {message.senderName}
                      </p>
                      <p
                        className={`mt-2 text-sm leading-7 ${
                          message.isCurrentUser ? "text-on-primary" : "text-on-surface-variant"
                        }`}
                      >
                        {message.body}
                      </p>
                      <p
                        className={`mt-3 text-xs uppercase tracking-[0.16em] ${
                          message.isCurrentUser ? "text-on-primary/80" : "text-outline"
                        }`}
                      >
                        {message.sentAtLabel}
                      </p>
                    </div>

                    {!message.isCurrentUser ? (
                      <details className="surface-card">
                        <summary className="flex cursor-pointer list-none items-center gap-2 font-label text-sm font-semibold text-primary">
                          <AlertTriangle aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                          Signaler ce message
                        </summary>
                        <form action={createMessageReport} className="mt-4 space-y-4">
                          <input type="hidden" name="threadId" value={thread.id} />
                          <input type="hidden" name="messageId" value={message.id} />

                          <label className="block space-y-2">
                            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                              Motif
                            </span>
                            <select
                              name="reason"
                              defaultValue="abuse"
                              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                            >
                              {reportReasonOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block space-y-2">
                            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                              Contexte utile
                            </span>
                            <textarea
                              name="details"
                              rows={3}
                              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                              placeholder="Expliquez brièvement pourquoi ce message mérite une revue."
                            />
                          </label>

                          <p className="text-sm leading-7 text-on-surface-variant">
                            Le signalement entre dans la file de modération de
                            l&apos;association. Les cas sévères sont escaladés avec un
                            propriétaire identifié.
                          </p>

                          <button
                            type="submit"
                            className="rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-primary shadow-ambient"
                          >
                            Envoyer le signalement
                          </button>
                        </form>
                      </details>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="surface-card">
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Aucun message pour le moment
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Cette conversation est prête. Le premier message apparaîtra ici.
                </p>
              </div>
            )}
          </div>

          <form action={sendMessage} className="surface-section space-y-4">
            <input type="hidden" name="threadId" value={thread.id} />
            <div className="space-y-2">
              <label
                htmlFor="body"
                className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant"
              >
                Répondre
              </label>
              <textarea
                id="body"
                name="body"
                rows={4}
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                placeholder="Écrire un message clair, utile et bienveillant."
                required
              />
            </div>
            <button
              type="submit"
              disabled={!thread.canSend}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Envoyer
              <Send aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </form>
        </section>
      </ThreadRealtimeProvider>
    </AppShell>
  );
}
