import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, Megaphone, Send, UsersRound } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { MemberPicker } from "@/components/admin/member-picker";
import { getAdminMessagingHistory, getMemberList } from "@/lib/admin-messaging";
import { requireStaff } from "@/lib/auth";

import { createGroup, sendBroadcast } from "./actions";

type AdminMessagingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "broadcast-sent": "La diffusion a été envoyée et les notifications ont été déclenchées.",
  "group-created": "Le groupe officiel a été créé et ses membres ont été prévenus.",
  "subject-required": "Ajoutez un sujet pour la diffusion.",
  "title-required": "Ajoutez un titre pour le groupe.",
  "body-too-short": "Le message doit contenir au moins 10 caractères.",
  "segment-invalid": "Le segment choisi est invalide.",
  "no-members": "Sélectionnez au moins un membre pour le groupe.",
  "broadcast-failed": "La diffusion n'a pas pu être envoyée.",
  "group-failed": "Le groupe n'a pas pu être créé.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminMessagingPage({
  searchParams,
}: AdminMessagingPageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const feedback = feedbackMap[error ?? status ?? ""] ?? null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const { user } = await requireStaff("/admin/messagerie");
  const [{ broadcasts, groups }, members] = await Promise.all([
    getAdminMessagingHistory(),
    getMemberList(),
  ]);

  return (
    <AppShell title="Messagerie collective" currentPath="/admin">
      <section className="space-y-6">
        <Link
          href={"/admin" as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour à l'administration
        </Link>

        <div className="space-y-3">
          <div className="eyebrow">Diffusions équipe</div>
          <h1 className="editorial-title">Informer largement sans perdre le cadre.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Envoyez un message collectif par segment ou ouvrez un groupe officiel pour un
            atelier, un cercle de parole ou un suivi cible.
          </p>
        </div>

        {feedback ? (
          <div
            className={`surface-card ${feedbackTone}`}
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
          >
            <p className="font-headline text-base font-semibold">Messagerie équipe</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <form action={sendBroadcast} className="surface-section space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Megaphone aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Diffusion par segment
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Crée un fil officiel pour chaque destinataire et complète les canaux
                  in-app, email et push quand ils sont actifs.
                </p>
              </div>
            </div>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Sujet
              </span>
              <input
                type="text"
                name="subject"
                required
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                placeholder="Atelier de jeudi, information pratique..."
              />
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Segment
              </span>
              <select
                name="segment"
                defaultValue="all"
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
              >
                <option value="all">Tous les membres</option>
                <option value="patient">Patientes</option>
                <option value="caregiver">Aidants</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Message
              </span>
              <textarea
                name="body"
                rows={6}
                required
                minLength={10}
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                placeholder="Écrivez un message simple, concret et actionnable."
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
            >
              <Send aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              Envoyer la diffusion
            </button>
          </form>

          <form action={createGroup} className="surface-section space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <UsersRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Groupe officiel
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Idéal pour un atelier fermé, une préparation bénévole ou un groupe de
                  parole à effectif choisi.
                </p>
              </div>
            </div>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Titre du groupe
              </span>
              <input
                type="text"
                name="title"
                required
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                placeholder="Groupe atelier nutrition avril"
              />
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Premier message
              </span>
              <textarea
                name="body"
                rows={5}
                required
                minLength={10}
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                placeholder="Bonjour, voici le cadre et le premier repère pour ce groupe..."
              />
            </label>

            <div className="space-y-3">
              <p className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Membres à inclure
              </p>
              <MemberPicker members={members} />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
            >
              <UsersRound aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              Creer le groupe
            </button>
          </form>
        </div>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="surface-card space-y-4">
            <div>
              <div className="eyebrow">Historique</div>
              <h2 className="font-headline text-xl font-semibold text-on-surface">
                Dernières diffusions
              </h2>
            </div>
            {broadcasts.length > 0 ? (
              broadcasts.map((broadcast) => (
                <article key={broadcast.id} className="rounded-brand bg-surface-container-low px-4 py-4">
                  <p className="font-headline text-base font-semibold text-on-surface">
                    {broadcast.subject}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    {broadcast.body}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-outline">
                    {broadcast.segment} · {broadcast.recipientCount} destinataires · {formatDate(broadcast.createdAt)}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-on-surface-variant">
                Aucune diffusion enregistrée pour le moment.
              </p>
            )}
          </div>

          <div className="surface-card space-y-4">
            <div>
              <div className="eyebrow">Groupes officiels</div>
              <h2 className="font-headline text-xl font-semibold text-on-surface">
                Derniers groupes crees
              </h2>
            </div>
            {groups.length > 0 ? (
              groups.map((group) => (
                <article key={group.id} className="rounded-brand bg-surface-container-low px-4 py-4">
                  <p className="font-headline text-base font-semibold text-on-surface">
                    {group.title}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-outline">
                    {group.participantCount} participants · {formatDate(group.createdAt)}
                  </p>
                  <Link
                    href={`/messages/${group.id}` as Route}
                    className="mt-3 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                  >
                    Ouvrir la conversation
                    <ArrowLeft aria-hidden="true" className="h-4 w-4 rotate-180" strokeWidth={1.8} />
                  </Link>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-on-surface-variant">
                Aucun groupe officiel cree pour l'instant.
              </p>
            )}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
