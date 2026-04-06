import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, HandHeart, HeartHandshake, Sparkles, UsersRound } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext } from "@/lib/auth";

import { submitAssociationEngagementRequest } from "./actions";

type AssociationEngagementPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "engagement-sent": "Votre demande a ete transmise a l'association.",
  "engagement-invalid": "Choisissez un type de demande et indiquez votre nom d'usage.",
  "engagement-failed": "La demande n'a pas pu etre enregistree.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const requestLabels: Record<string, string> = {
  membership: "Adhesion",
  donation: "Don ou soutien financier",
  volunteer: "Benevolat",
  mentorship: "Mentorat",
  support: "Demande d'accompagnement",
};

export default async function AssociationEngagementPage({
  searchParams,
}: AssociationEngagementPageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const preselectedKind = firstValue(query.kind) ?? "membership";
  const feedback = feedbackMap[error ?? status ?? ""] ?? null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const { user, profile } = await getCurrentUserContext();

  return (
    <AppShell title="Association" currentPath="/association">
      <section className="space-y-6">
        <Link
          href={"/association" as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour a l'association
        </Link>

        <div className="space-y-3">
          <div className="eyebrow">Engagement ROSE-SEIN</div>
          <h1 className="editorial-title">Adherer, soutenir, aider ou demander un lien direct.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Cette page internalise les demandes principales a l'association. Le suivi
            reste humain: une membre de l'equipe revient vers vous depuis l'application
            ou par email selon votre preference.
          </p>
        </div>

        {feedback ? (
          <div className={`surface-card ${feedbackTone}`}>
            <p className="font-headline text-base font-semibold">Association</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="mt-5 font-headline text-lg font-semibold text-on-surface">Adhesion & don</p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Formalisez votre envie de soutenir l'association sans quitter l'application.
            </p>
          </div>
          <div className="surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <UsersRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="mt-5 font-headline text-lg font-semibold text-on-surface">Benevolat & mentorat</p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Signalez votre disponibilite ou demandez une mise en relation utile.
            </p>
          </div>
          <div className="surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="mt-5 font-headline text-lg font-semibold text-on-surface">Suivi simple</p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              La demande reste tracable et l'association peut la traiter proprement.
            </p>
          </div>
        </div>

        {user && profile ? (
          <form action={submitAssociationEngagementRequest} className="surface-section space-y-5">
            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Type de demande
              </span>
              <select
                name="requestKind"
                defaultValue={preselectedKind}
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
              >
                {Object.entries(requestLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Nom d'usage
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  minLength={2}
                  defaultValue={profile.displayName}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                />
              </label>

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Email de contact
                </span>
                <input
                  type="email"
                  name="email"
                  defaultValue={user.email ?? ""}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Telephone
              </span>
              <input
                type="tel"
                name="phone"
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                placeholder="Optionnel"
              />
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Message
              </span>
              <textarea
                name="message"
                rows={6}
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                placeholder="Expliquez votre besoin, votre disponibilite ou la forme d'engagement souhaitee."
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
            >
              <HandHeart aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              Envoyer la demande
            </button>
          </form>
        ) : (
          <div className="surface-section space-y-4">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Connectez-vous pour transmettre une demande suivie.
            </p>
            <p className="text-sm leading-7 text-on-surface-variant">
              L'association doit pouvoir vous recontacter sans perdre le contexte.
            </p>
            <Link
              href={"/account?redirectTo=%2Fassociation%2Fengagement" as Route}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
            >
              Se connecter
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
