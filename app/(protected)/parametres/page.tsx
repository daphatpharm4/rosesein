import Link from "next/link";
import type { Route } from "next";
import { BellRing, LifeBuoy, LockKeyhole, Mail, ShieldCheck, UserRoundCog } from "lucide-react";

import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { signOut } from "@/app/account/actions";
import { PushChannelManager } from "@/components/notifications/push-channel-manager";
import { getPushVapidPublicKey } from "@/lib/env";
import { PROFILE_KIND_LABELS } from "@/lib/auth";
import { getSettingsSnapshot } from "@/lib/settings";

import { submitPrivacyRequest, updateNotificationPreferences, updateProfileSettings } from "./actions";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "profile-updated": "Votre profil a été mis à jour.",
  "preferences-updated": "Vos préférences de notification ont été enregistrées.",
  "profile-kind-required": "Choisissez le profil à afficher dans votre compte.",
  "display-name-required": "Indiquez un prénom ou un nom d'usage d'au moins deux caractères.",
  "profile-update-failed": "Le profil n'a pas pu être mis à jour pour le moment.",
  "preferences-update-failed":
    "Les préférences de notification n'ont pas pu être enregistrées.",
  "privacy-request-sent": "Votre demande liée aux données personnelles a été transmise.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const feedbackKey = error ?? status;
  const feedback = feedbackKey ? feedbackMap[feedbackKey] : null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const { email, profile, roles, notificationPreferences } = await getSettingsSnapshot();
  const vapidPublicKey = getPushVapidPublicKey();
  const isProfessional = profile.profileKind === "professional";

  return (
    <AppShell title="Paramètres" currentPath="/parametres">
      <section className="space-y-6">
        <BackLink href="/account" label="Retour au compte" />

        <div className="space-y-3">
          <div className="eyebrow">Compte et confidentialité</div>
          <h1 className="editorial-title">Votre compte, vos préférences, votre cadre.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Réglez ici ce qui vous représente et la façon dont vous souhaitez être
            contactée. Ces choix restent liés à votre compte et peuvent être modifiés
            à tout moment.
          </p>
        </div>

        {feedback ? (
          <div
            className={`surface-card ${feedbackTone}`}
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
          >
            <p className="font-headline text-base font-semibold">Paramètres</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <form action={updateProfileSettings} className="surface-section space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRoundCog aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Profil visible dans l&apos;application
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Ajustez votre identité d&apos;usage sans perdre le lien sécurisé avec
                  l&apos;association si une modération ou un soutien devient nécessaire.
                </p>
              </div>
            </div>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Adresse du compte
              </span>
              <div className="flex items-center gap-3 rounded-brand bg-surface-container-low px-4 py-4 text-sm text-on-surface">
                <Mail aria-hidden="true" className="h-4 w-4 text-primary" strokeWidth={1.8} />
                <span>{email ?? "Adresse email indisponible"}</span>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Je suis
              </span>
              {isProfessional ? (
                <>
                  <input type="hidden" name="profileKind" value="professional" />
                  <div className="rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface">
                    {PROFILE_KIND_LABELS[profile.profileKind]}
                  </div>
                </>
              ) : (
                <select
                  name="profileKind"
                  defaultValue={profile.profileKind}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                >
                  <option value="patient">Patiente</option>
                  <option value="caregiver">Aidant</option>
                </select>
              )}
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Prénom ou nom d&apos;usage
              </span>
              <input
                type="text"
                name="displayName"
                defaultValue={profile.displayName}
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Pseudonyme
              </span>
              <input
                type="text"
                name="pseudonym"
                defaultValue={profile.pseudonym ?? ""}
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                placeholder="RoseCalme"
              />
            </label>

            <label className="flex items-start gap-3 rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
              <input
                type="checkbox"
                name="isAnonymous"
                defaultChecked={profile.isAnonymous}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
              />
              <span className="text-sm leading-7 text-on-surface-variant">
                Afficher mon pseudonyme dans les espaces prévus. L&apos;association garde
                malgré tout le lien avec mon compte réel pour la sécurité, le support
                et la modération.
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-brand bg-secondary-container/40 px-4 py-4">
              <input
                type="checkbox"
                name="difficultDayMode"
                defaultChecked={profile.difficultDayMode}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
              />
              <span className="text-sm leading-7 text-on-surface-variant">
                Activer le mode journée difficile: messages plus courts, hiérarchie plus
                calme et repères plus immédiats sur l&apos;accueil.
              </span>
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
            >
              Enregistrer le profil
            </button>
          </form>

          <div className="surface-card space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Explication simple sur la confidentialité
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Votre identité, vos messages privés et vos préférences restent dans
                  des surfaces authentifiées. Le mode pseudonyme masque votre nom
                  d&apos;usage là où c&apos;est prévu, mais ne supprime jamais la
                  traçabilité nécessaire en cas de signalement ou d&apos;escalade.
                </p>
              </div>
            </div>

            <div className="rounded-brand bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant">
              <p>
                <span className="font-semibold text-on-surface">Rôles actifs:</span>{" "}
                {roles.length > 0 ? roles.join(", ") : "membre"}
              </p>
              <p>
                <span className="font-semibold text-on-surface">Mode public:</span>{" "}
                {profile.isAnonymous ? "Pseudonyme affiché" : "Nom d'usage affiché"}
              </p>
              <p>
                <span className="font-semibold text-on-surface">Support:</span>{" "}
                En cas de doute sur vos données, contactez l&apos;association avant tout
                partage sensible.
              </p>
            </div>

            <div className="rounded-brand bg-secondary-container/60 px-4 py-4 text-sm leading-7 text-on-surface">
              Nous utilisons un langage volontairement simple ici: vous choisissez ce
              qui est visible, l&apos;équipe protège l&apos;accès, et les paramètres ne sont
              jamais exposés sur les pages publiques.
            </div>

            <div className="rounded-brand bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant">
              <p className="font-semibold text-on-surface">Aide rapide</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={"/aide" as Route}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-primary shadow-ambient sm:w-auto"
                >
                  <LifeBuoy aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  Ouvrir l&apos;aide
                </Link>
                <Link
                  href={"/association/engagement" as Route}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-primary shadow-ambient sm:w-auto"
                >
                  Contacter l&apos;association
                </Link>
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="w-full rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-on-surface shadow-ambient"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>

        <form action={updateNotificationPreferences} className="surface-section space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <BellRing aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-lg font-semibold text-on-surface">
                Notifications à conserver
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Choisissez seulement les signaux utiles. L&apos;objectif est de garder une
                messagerie calme et des rappels compréhensibles.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="surface-card flex items-start gap-3">
              <input
                type="checkbox"
                name="messagesEnabled"
                defaultChecked={notificationPreferences.messagesEnabled}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
              />
              <span>
                <span className="block font-headline text-base font-semibold text-on-surface">
                  Nouveaux messages
                </span>
                <span className="mt-2 block text-sm leading-7 text-on-surface-variant">
                  Prévenir lorsqu&apos;une nouvelle conversation ou un nouveau message est
                  disponible pour vous.
                </span>
              </span>
            </label>

            <label className="surface-card flex items-start gap-3">
              <input
                type="checkbox"
                name="repliesEnabled"
                defaultChecked={notificationPreferences.repliesEnabled}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
              />
              <span>
                <span className="block font-headline text-base font-semibold text-on-surface">
                  Réponses dans vos échanges
                </span>
                <span className="mt-2 block text-sm leading-7 text-on-surface-variant">
                  Signaler qu&apos;une réponse est arrivée dans un fil que vous suivez déjà.
                </span>
              </span>
            </label>

            <label className="surface-card flex items-start gap-3">
              <input
                type="checkbox"
                name="newsEnabled"
                defaultChecked={notificationPreferences.newsEnabled}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
              />
              <span>
                <span className="block font-headline text-base font-semibold text-on-surface">
                  Actualités validées
                </span>
                <span className="mt-2 block text-sm leading-7 text-on-surface-variant">
                  Recevoir les repères éditoriaux publiés par l&apos;association.
                </span>
              </span>
            </label>

            <label className="surface-card flex items-start gap-3">
              <input
                type="checkbox"
                name="eventsEnabled"
                defaultChecked={notificationPreferences.eventsEnabled}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
              />
              <span>
                <span className="block font-headline text-base font-semibold text-on-surface">
                  Événements et ateliers
                </span>
                <span className="mt-2 block text-sm leading-7 text-on-surface-variant">
                  Être prévenu des rendez-vous publiés et des changements utiles.
                </span>
              </span>
            </label>

            <label className="surface-card flex items-start gap-3">
              <input
                type="checkbox"
                name="emailEnabled"
                defaultChecked={notificationPreferences.emailEnabled}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
              />
              <span>
                <span className="block font-headline text-base font-semibold text-on-surface">
                  Email
                </span>
                <span className="mt-2 block text-sm leading-7 text-on-surface-variant">
                  Recevoir un résumé utile par email lorsque le canal est configuré.
                </span>
              </span>
            </label>

            <label className="surface-card flex items-start gap-3">
              <input
                type="checkbox"
                name="pushEnabled"
                defaultChecked={notificationPreferences.pushEnabled}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
              />
              <span>
                <span className="block font-headline text-base font-semibold text-on-surface">
                  Push navigateur
                </span>
                <span className="mt-2 block text-sm leading-7 text-on-surface-variant">
                  Afficher une alerte sur cet appareil quand le navigateur l&apos;autorise.
                </span>
              </span>
            </label>
          </div>

          <div className="flex items-start gap-3 rounded-brand bg-surface-container-low px-4 py-4">
            <LockKeyhole aria-hidden="true" className="mt-1 h-5 w-5 text-primary" strokeWidth={1.8} />
            <p className="text-sm leading-7 text-on-surface-variant">
              Ces préférences pilotent ce que vous acceptez de recevoir. Elles ne
              changent ni vos droits d&apos;accès, ni la visibilité de vos données dans les
              espaces protégés.
            </p>
          </div>

          <PushChannelManager vapidPublicKey={vapidPublicKey} />

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
          >
            Enregistrer les notifications
          </button>
        </form>

        <form action={submitPrivacyRequest} className="surface-section space-y-4">
          <div>
            <div className="eyebrow">Données personnelles</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Exercer vos droits
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-on-surface-variant">
              Utilisez ce formulaire pour demander une exportation, une correction, ou une
              suppression de vos données liées à ROSE-SEIN.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Type de demande
            </span>
            <select
              name="requestKind"
              defaultValue="export"
              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
            >
              <option value="export">Exporter mes données</option>
              <option value="correction">Corriger mes données</option>
              <option value="deletion">Supprimer mes données</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Contexte utile
            </span>
            <textarea
              name="details"
              rows={4}
              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
              placeholder="Précisez si la demande concerne la messagerie, les notes, les documents, ou l'ensemble du compte."
            />
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
          >
            Envoyer la demande
          </button>
        </form>
      </section>
    </AppShell>
  );
}
