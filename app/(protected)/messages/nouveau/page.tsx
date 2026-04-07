import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, MessageSquarePlus, Search, Sparkles } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { searchMemberDirectory } from "@/lib/member-directory";

import { startDirectConversation } from "../actions";

type NewConversationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "message-required": "Choisissez un membre et écrivez un premier message.",
  "message-send-failed": "La conversation n'a pas pu être ouverte.",
  "thread-not-found": "Le membre demandé n'est pas disponible pour le moment.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewConversationPage({ searchParams }: NewConversationPageProps) {
  const query = (await searchParams) ?? {};
  const q = firstValue(query.q) ?? "";
  const error = firstValue(query.error);
  const members = await searchMemberDirectory(q);

  return (
    <AppShell title="Nouvelle conversation" currentPath="/messages">
      <section className="space-y-6">
        <Link
          href={"/messages" as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour à la messagerie
        </Link>

        <div className="space-y-3">
          <div className="eyebrow">Messagerie entre membres</div>
          <h1 className="editorial-title">Commencer un échange utile et respectueux.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Recherchez un membre, puis envoyez un premier message. Le cadre reste
            modéré et la charte de bienveillance s&apos;applique à chaque nouvel échange.
          </p>
        </div>

        {error && feedbackMap[error] ? (
          <div
            className="surface-card bg-primary/10 text-on-primary-container"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-headline text-base font-semibold">Nouvelle conversation</p>
            <p className="mt-2 text-sm leading-7">{feedbackMap[error]}</p>
          </div>
        ) : null}

        <form className="surface-section" action="/messages/nouveau">
          <label className="block space-y-2">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Rechercher un membre
            </span>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                strokeWidth={1.8}
              />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Pseudonyme, prénom d'usage..."
                className="w-full rounded-brand bg-surface-container-high py-4 pl-11 pr-4 text-sm text-on-surface placeholder:text-outline"
              />
            </div>
          </label>
        </form>

        <section className="surface-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <Sparkles aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface">
                Charte de bienveillance
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Pas de jugement, pas de pression, pas de conseils médicaux affirmés comme
                des certitudes. Si un échange devient inconfortable, utilisez le
                signalement ou contactez l&apos;association.
              </p>
            </div>
          </div>
        </section>

        {members.length > 0 ? (
          <div className="space-y-4">
            {members.map((member) => (
              <article key={member.id} className="surface-section space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-headline text-lg font-semibold text-on-surface">
                      {member.visibleName}
                    </p>
                    <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                      {member.profileKind === "patient" ? "Patiente" : "Aidant"}
                      {member.isAnonymous ? " · profil pseudonyme" : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface-container-low px-3 py-2 font-label text-xs font-semibold text-on-surface-variant">
                    {member.hasExistingThread ? "Conversation existante" : "Nouveau contact"}
                  </span>
                </div>

                <form action={startDirectConversation} className="space-y-4">
                  <input type="hidden" name="targetUserId" value={member.id} />
                  <label className="block space-y-2">
                    <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Premier message
                    </span>
                    <textarea
                      name="body"
                      rows={4}
                      required
                      className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                      placeholder="Bonjour, je voulais vous écrire au sujet de..."
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                  >
                    <MessageSquarePlus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                    {member.hasExistingThread ? "Reprendre l'échange" : "Ouvrir la conversation"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Aucun membre ne correspond à cette recherche
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Essayez un autre prénom d&apos;usage ou un autre pseudonyme.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
