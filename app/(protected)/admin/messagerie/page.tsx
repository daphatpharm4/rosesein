// app/(protected)/admin/messagerie/page.tsx
import Link from "next/link";
import { ArrowLeft, Send, Users } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { MemberPicker } from "@/components/admin/member-picker";
import { requireStaff } from "@/lib/auth";
import {
  getAdminMessagingHistory,
  getMemberList,
} from "@/lib/admin-messaging";
import { sendBroadcast, createGroup } from "./actions";

export const metadata: Metadata = { title: "Messagerie collective" };
export const dynamic = "force-dynamic";

const ERROR_LABELS: Record<string, string> = {
  "subject-required": "Le sujet est obligatoire.",
  "body-too-short": "Le message doit contenir au moins 10 caractères.",
  "segment-invalid": "Veuillez sélectionner un groupe de destinataires.",
  "title-required": "Le nom du groupe est obligatoire.",
  "no-members": "Sélectionnez au moins un membre.",
  "broadcast-failed": "L'envoi a échoué. Veuillez réessayer.",
  "group-failed": "La création du groupe a échoué. Veuillez réessayer.",
};

const SEGMENT_LABELS: Record<string, string> = {
  all: "Tous",
  patient: "Patients",
  caregiver: "Aidants",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function MessageriePage({ searchParams }: Props) {
  const { user } = await requireStaff("/admin/messagerie");
  const { error } = await searchParams;

  const [history, members] = await Promise.all([
    getAdminMessagingHistory(user.id),
    getMemberList(),
  ]);

  return (
    <AppShell title="Administration" currentPath="/admin">
      <section className="space-y-8">
        <Link
          href={"/admin" as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Administration
        </Link>

        <div className="space-y-2">
          <div className="eyebrow">Espace équipe</div>
          <h1 className="editorial-title">Messagerie collective</h1>
          <p className="text-base leading-7 text-on-surface-variant">
            Diffusez un message à tous vos membres ou créez des groupes de conversation.
          </p>
        </div>

        {/* Error banner */}
        {error && ERROR_LABELS[error] && (
          <div className="rounded-brand bg-primary/10 px-4 py-3 font-label text-sm font-semibold text-primary">
            {ERROR_LABELS[error]}
          </div>
        )}

        {/* History */}
        <section className="space-y-4">
          <h2 className="font-headline text-lg font-semibold text-on-surface">Historique</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Broadcasts */}
            <div className="surface-section space-y-3">
              <h3 className="font-label text-sm font-semibold uppercase tracking-[0.12em] text-outline">
                Diffusions envoyées
              </h3>
              {history.broadcasts.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Aucune diffusion envoyée.</p>
              ) : (
                <ul className="space-y-3">
                  {history.broadcasts.map((b) => (
                    <li key={b.id} className="flex flex-col gap-0.5">
                      <span className="font-label text-sm font-semibold text-on-surface">
                        {b.subject}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label text-xs text-on-secondary-container">
                          {SEGMENT_LABELS[b.segment] ?? b.segment}
                        </span>
                        {b.recipientCount} destinataire{b.recipientCount > 1 ? "s" : ""}
                        &middot; {formatDate(b.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Groups */}
            <div className="surface-section space-y-3">
              <h3 className="font-label text-sm font-semibold uppercase tracking-[0.12em] text-outline">
                Groupes créés
              </h3>
              {history.groups.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Aucun groupe créé.</p>
              ) : (
                <ul className="space-y-3">
                  {history.groups.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-label text-sm font-semibold text-on-surface">
                          {g.title}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {g.participantCount} membre{g.participantCount > 1 ? "s" : ""} &middot;{" "}
                          {formatDate(g.createdAt)}
                        </span>
                      </div>
                      <Link
                        href={`/messages/${g.id}` as Route}
                        className="shrink-0 font-label text-xs font-semibold text-primary hover:underline"
                      >
                        Ouvrir →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Broadcast form */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Envoyer une diffusion
            </h2>
            <p className="text-sm text-on-surface-variant">
              Chaque destinataire reçoit un fil privé avec l&apos;association dans sa messagerie.
            </p>
          </div>
          <form action={sendBroadcast} className="surface-section space-y-5">
            <div className="space-y-2">
              <label htmlFor="broadcast-subject" className="font-label text-sm font-semibold text-on-surface">
                Sujet
              </label>
              <input
                id="broadcast-subject"
                name="subject"
                type="text"
                required
                placeholder="ex : Réunion mensuelle de septembre"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="broadcast-body" className="font-label text-sm font-semibold text-on-surface">
                Message
              </label>
              <textarea
                id="broadcast-body"
                name="body"
                required
                minLength={10}
                rows={4}
                placeholder="Écrivez votre message ici…"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm leading-7 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="font-label text-sm font-semibold text-on-surface">
                Destinataires
              </legend>
              <div className="flex flex-wrap gap-4">
                {(["all", "patient", "caregiver"] as const).map((seg) => (
                  <label key={seg} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="segment"
                      value={seg}
                      defaultChecked={seg === "all"}
                      className="accent-primary"
                    />
                    <span className="font-body text-sm text-on-surface">
                      {seg === "all" ? "Tous les membres" : seg === "patient" ? "Patients" : "Aidants"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
              >
                <Send aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Envoyer la diffusion
              </button>
            </div>
          </form>
        </section>

        {/* Group creation form */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Créer un groupe
            </h2>
            <p className="text-sm text-on-surface-variant">
              Un groupe de conversation partagé — tous les membres peuvent lire et répondre.
            </p>
          </div>
          <form action={createGroup} className="surface-section space-y-5">
            <div className="space-y-2">
              <label htmlFor="group-title" className="font-label text-sm font-semibold text-on-surface">
                Nom du groupe
              </label>
              <input
                id="group-title"
                name="title"
                type="text"
                required
                placeholder="ex : Groupe soutien septembre 2026"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="group-body" className="font-label text-sm font-semibold text-on-surface">
                Premier message
              </label>
              <textarea
                id="group-body"
                name="body"
                required
                minLength={10}
                rows={3}
                placeholder="Bonjour à toutes et tous…"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm leading-7 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <p className="font-label text-sm font-semibold text-on-surface">
                Membres
              </p>
              <MemberPicker members={members} />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
              >
                <Users aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Créer le groupe
              </button>
            </div>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
