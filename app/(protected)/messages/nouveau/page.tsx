import type { Route } from "next";
import { MessageSquarePlus, Search, Sparkles, Users } from "lucide-react";

import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { searchMemberDirectory } from "@/lib/member-directory";

import { createGroupConversation, startDirectConversation } from "../actions";

type NewConversationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "message-required": "Choisissez les destinataires utiles et écrivez un premier message.",
  "message-send-failed": "La conversation ou le groupe n'a pas pu être ouvert.",
  "thread-not-found": "Le membre demandé n'est pas disponible pour le moment.",
  "group-title-required": "Donnez un nom au groupe avant de l'ouvrir.",
  "group-members-required": "Choisissez au moins deux membres pour créer un groupe.",
  "group-create-failed": "Le groupe n'a pas pu être créé pour le moment.",
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
    <AppShell title="Nouveau message ou groupe" currentPath="/messages">
      <section className="space-y-6">
        <BackLink href="/messages" label="Retour à la messagerie" />

        <div className="space-y-3">
          <div className="eyebrow">Messagerie entre membres</div>
          <h1 className="editorial-title">Écrire à une personne ou ouvrir un groupe privé.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Recherchez des membres, puis choisissez le bon format: une conversation
            directe ou un groupe privé entre membres. Le cadre reste modéré et la
            charte de bienveillance s&apos;applique à chaque nouvel échange.
          </p>
        </div>

        {error && feedbackMap[error] ? (
          <div
            className="surface-card bg-primary/10 text-on-primary-container"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-headline text-base font-semibold">Nouvelle conversation ou groupe</p>
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

        <section className="surface-section space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <p className="font-headline text-lg font-semibold text-on-surface">
                Créer un groupe entre membres
              </p>
              <p className="text-sm leading-7 text-on-surface-variant">
                Donnez un nom au groupe, écrivez le premier message, puis sélectionnez
                au moins deux membres à inviter.
              </p>
            </div>
          </div>

          <form action={createGroupConversation} className="space-y-5">
            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Nom du groupe
              </span>
              <input
                type="text"
                name="title"
                required
                placeholder="Ex. Cercle de parole, proches aidants Paris..."
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
              />
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Premier message
              </span>
              <textarea
                name="body"
                rows={4}
                required
                placeholder="Bonjour, je vous propose d'ouvrir ce groupe pour..."
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
              />
            </label>

            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Membres à inviter
                </p>
                <p className="text-sm leading-6 text-on-surface-variant">
                  {members.length > 0
                    ? "Sélectionnez au moins deux membres dans la liste filtrée."
                    : "Lancez une recherche pour sélectionner des membres."}
                </p>
              </div>

              {members.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {members.map((member) => (
                    <label
                      key={`group-${member.id}`}
                      className="flex items-start gap-3 rounded-brand border border-outline-variant/35 bg-surface-container-lowest px-4 py-4"
                    >
                      <input
                        type="checkbox"
                        name="memberIds"
                        value={member.id}
                        className="mt-1 h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                      />
                      <span className="space-y-1">
                        <span className="block font-headline text-base font-semibold text-on-surface">
                          {member.visibleName}
                        </span>
                        <span className="block text-sm leading-6 text-on-surface-variant">
                          {member.profileKind === "patient" ? "Patiente" : "Aidant"}
                          {member.isAnonymous ? " · profil pseudonyme" : ""}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-brand border border-dashed border-outline-variant/40 bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant">
                  Aucun membre n&apos;est disponible avec ce filtre. Essayez un autre
                  prénom d&apos;usage ou un autre pseudonyme.
                </div>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
            >
              <Users aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              Créer le groupe
            </button>
          </form>
        </section>

        {members.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="eyebrow">Conversation directe</div>
              <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                Si vous préférez écrire à une seule personne, utilisez l&apos;un des
                formulaires ci-dessous.
              </p>
            </div>
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
