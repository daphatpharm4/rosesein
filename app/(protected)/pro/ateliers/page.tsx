import Link from "next/link";
import { CalendarRange, Eye, EyeOff, PencilLine, Sparkles, UsersRound, Video } from "lucide-react";
import type { Route } from "next";

import { EventKindBadge } from "@/components/content/event-kind-badge";
import { BackLink } from "@/components/navigation/back-link";
import { SubscriptionBadge } from "@/components/pro/subscription-badge";
import { AppShell } from "@/components/shell/app-shell";
import { requireProfessionalTier } from "@/lib/auth";
import { formatEventSchedule } from "@/lib/content";
import { formatEventDateTimeInput, getProfessionalEventsSnapshot } from "@/lib/events";

import { saveProfessionalEvent, toggleProfessionalEventPublish } from "./actions";

export const dynamic = "force-dynamic";

type ProEventsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "event-created": "Le format collectif a été créé.",
  "event-updated": "Le format collectif a été mis à jour.",
  "event-published": "La page publique est maintenant visible.",
  "event-unpublished": "La page publique a été retirée.",
  "event-invalid": "Complétez le type, le titre, la description et la date de début.",
  "event-datetime-invalid": "Le format de date ou d'heure est invalide.",
  "event-end-before-start": "La fin doit être postérieure au début.",
  "event-not-found": "Le format demandé est introuvable.",
  "event-save-failed": "L'enregistrement n'a pas pu aboutir.",
  "event-publish-failed": "Le changement de publication a échoué.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatRegistrationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ProEventsPage({ searchParams }: ProEventsPageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const edit = firstValue(query.edit);
  const feedback = feedbackMap[error ?? status ?? ""] ?? null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const { user, professionalProfile } = await requireProfessionalTier(["partenaire"], {
    redirectTo: "/pro/ateliers",
    fallbackPath: "/pro",
    error: "events-tier-locked",
  });
  const managedEvents = await getProfessionalEventsSnapshot(user.id);
  const eventToEdit = edit ? managedEvents.find((event) => event.id === edit) ?? null : null;
  const publishedCount = managedEvents.filter((event) => event.isPublished).length;
  const activeRegistrationCount = managedEvents.reduce(
    (total, event) => total + event.registrationCount,
    0,
  );
  const upcomingCount = managedEvents.filter(
    (event) => new Date(event.startsAt).getTime() > Date.now(),
  ).length;

  return (
    <AppShell title="Espace pro" currentPath="/pro" wide>
      <section className="space-y-6">
        <BackLink href="/pro" label="Retour à l'espace pro" />

        <div className="surface-section space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="eyebrow">Formats collectifs</div>
              <div className="space-y-2">
                <h1 className="editorial-title">
                  Proposer un atelier ou un webinaire sans brouiller votre pratique.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                  Cette surface sert aux formats collectifs publiés dans l&apos;écosystème
                  ROSE-SEIN. La fiche individuelle reste dédiée aux consultations, tandis que
                  l&apos;atelier ou le webinaire possède sa propre page d&apos;inscription.
                </p>
              </div>
            </div>

            <SubscriptionBadge tier={professionalProfile.subscriptionTier} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
              <p className="text-xs uppercase tracking-[0.16em] text-outline">
                Formats publiés
              </p>
              <p className="mt-2 font-headline text-3xl font-bold text-on-surface">
                {publishedCount}
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Pages visibles dans les actualités et sur votre fiche.
              </p>
            </div>
            <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
              <p className="text-xs uppercase tracking-[0.16em] text-outline">
                Inscriptions actives
              </p>
              <p className="mt-2 font-headline text-3xl font-bold text-on-surface">
                {activeRegistrationCount}
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Participations confirmées sur l&apos;ensemble des formats.
              </p>
            </div>
            <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
              <p className="text-xs uppercase tracking-[0.16em] text-outline">
                Formats à venir
              </p>
              <p className="mt-2 font-headline text-3xl font-bold text-on-surface">
                {upcomingCount}
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Sessions déjà planifiées dans les prochains jours.
              </p>
            </div>
          </div>
        </div>

        {feedback ? (
          <div className={`surface-card ${feedbackTone}`} role={error ? "alert" : "status"}>
            <p className="font-headline text-base font-semibold">Ateliers et webinaires</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.9fr)]">
          <section className="space-y-6">
              <div className="surface-section space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="eyebrow">Publication</div>
                    <h2 className="font-headline text-2xl font-bold text-on-surface">
                      {eventToEdit ? "Mettre à jour le format" : "Nouvel atelier ou webinaire"}
                    </h2>
                    <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                      Choisissez un seul format, donnez un cadre clair et publiez
                      seulement lorsque la page est prête à recevoir des inscriptions.
                    </p>
                  </div>

                  {eventToEdit ? (
                    <Link
                      href={"/pro/ateliers" as Route}
                      className="rounded-full bg-surface-container-low px-4 py-2.5 font-label text-sm font-semibold text-on-surface"
                    >
                      Nouveau format
                    </Link>
                  ) : null}
                </div>

                <form action={saveProfessionalEvent} className="space-y-5">
                  <input type="hidden" name="eventId" value={eventToEdit?.id ?? ""} />

                  <fieldset className="space-y-3">
                    <legend className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Type de format
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          value: "atelier",
                          title: "Atelier",
                          description:
                            "Petit groupe, format plus interactif, échanges ou exercices guidés.",
                        },
                        {
                          value: "webinaire",
                          title: "Webinaire",
                          description:
                            "Session en ligne plus cadrée, adaptée à l'information ou à la transmission d'un repère.",
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="group flex min-h-28 items-start gap-3 rounded-brand border border-transparent bg-surface-container-lowest px-4 py-4 shadow-ambient transition-colors has-[:checked]:border-primary/30 has-[:checked]:bg-primary/5"
                        >
                          <input
                            type="radio"
                            name="eventKind"
                            value={option.value}
                            defaultChecked={(eventToEdit?.eventKind ?? "atelier") === option.value}
                            className="mt-1 h-4 w-4 border-outline-variant text-primary focus:ring-primary/20"
                          />
                          <span className="space-y-1">
                            <span className="block font-headline text-base font-semibold text-on-surface">
                              {option.title}
                            </span>
                            <span className="block text-base leading-7 text-on-surface-variant">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2 md:col-span-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Titre public
                      </span>
                      <input
                        type="text"
                        name="title"
                        required
                        minLength={4}
                        defaultValue={eventToEdit?.title ?? ""}
                        placeholder="Atelier retour au mouvement après traitement"
                        className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Début
                      </span>
                      <input
                        type="datetime-local"
                        name="startsAt"
                        required
                        defaultValue={formatEventDateTimeInput(eventToEdit?.startsAt ?? null)}
                        className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Fin
                      </span>
                      <input
                        type="datetime-local"
                        name="endsAt"
                        defaultValue={formatEventDateTimeInput(eventToEdit?.endsAt ?? null)}
                        className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                      />
                    </label>

                    <label className="block space-y-2 md:col-span-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Lieu ou lien
                      </span>
                      <input
                        type="text"
                        name="locationLabel"
                        defaultValue={eventToEdit?.locationLabel ?? ""}
                        placeholder="En visio · Zoom ou Maison Rose, Paris"
                        className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                      />
                    </label>

                    <label className="block space-y-2 md:col-span-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Description
                      </span>
                      <textarea
                        name="description"
                        rows={5}
                        required
                        minLength={10}
                        defaultValue={eventToEdit?.description ?? ""}
                        placeholder="Précisez pour qui est ce format, ce qui sera abordé, et ce que l'inscription permet concrètement."
                        className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm leading-7 text-on-surface placeholder:text-outline"
                      />
                    </label>
                  </div>

                  <label className="flex items-start gap-3 rounded-brand bg-secondary-container/35 px-4 py-4 text-sm leading-7 text-on-surface-variant">
                    <input
                      type="checkbox"
                      name="publishNow"
                      defaultChecked={eventToEdit ? eventToEdit.isPublished : true}
                      className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                    />
                    <span>
                      Publier dès l&apos;enregistrement
                      <span className="block text-on-surface-variant">
                        Les membres verront alors une page dédiée avec le détail du format
                        et le formulaire d&apos;inscription.
                      </span>
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-label text-sm font-semibold text-on-primary"
                  >
                    <Sparkles aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                    {eventToEdit ? "Mettre à jour" : "Créer le format"}
                  </button>
                </form>
              </div>

              <section className="space-y-4">
                <div>
                  <div className="eyebrow">Formats publiés ou préparés</div>
                  <h2 className="font-headline text-2xl font-bold text-on-surface">
                    Vos ateliers et webinaires
                  </h2>
                </div>

                {managedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {managedEvents.map((event) => (
                      <article key={event.id} className="surface-card space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <EventKindBadge kind={event.eventKind} />
                              <span
                                className={`rounded-full px-3 py-1 font-label text-xs font-semibold ${
                                  event.isPublished
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : "bg-surface-container-low text-on-surface-variant"
                                }`}
                              >
                                {event.isPublished ? "Publié" : "Brouillon"}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-headline text-xl font-semibold text-on-surface">
                                {event.title}
                              </h3>
                              <p className="max-w-3xl text-base leading-8 text-on-surface-variant">
                                {event.description}
                              </p>
                              <p className="text-sm font-semibold text-on-surface">
                                {formatEventSchedule(event)}
                              </p>
                              {event.locationLabel ? (
                                <p className="text-xs uppercase tracking-[0.16em] text-outline">
                                  {event.locationLabel}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Link
                              href={`/pro/ateliers?edit=${event.id}` as Route}
                              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-container-low px-4 py-2.5 font-label text-sm font-semibold text-on-surface"
                            >
                              <PencilLine aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                              Modifier
                            </Link>

                            <form action={toggleProfessionalEventPublish}>
                              <input type="hidden" name="eventId" value={event.id} />
                              <button
                                type="submit"
                                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-container-low px-4 py-2.5 font-label text-sm font-semibold text-on-surface"
                              >
                                {event.isPublished ? (
                                  <EyeOff aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                                ) : (
                                  <Eye aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                                )}
                                {event.isPublished ? "Retirer" : "Publier"}
                              </button>
                            </form>

                            {event.isPublished ? (
                              <Link
                                href={`/actualites/evenements/${event.id}` as Route}
                                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 font-label text-sm font-semibold text-on-primary"
                              >
                                Voir la page publique
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="surface-card">
                    <p className="font-headline text-lg font-semibold text-on-surface">
                      Aucun format collectif pour le moment
                    </p>
                    <p className="mt-2 max-w-2xl text-base leading-8 text-on-surface-variant">
                      Commencez avec un seul atelier ou un seul webinaire clairement cadré.
                      La lecture restera plus simple pour les patientes que plusieurs formats
                      publiés d&apos;un coup.
                    </p>
                  </div>
                )}
              </section>
            </section>

            <aside className="space-y-4">
              <div className="surface-card space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <UsersRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Inscriptions reçues
                  </p>
                </div>

                {managedEvents.some((event) => event.registrations.length > 0) ? (
                  <div className="space-y-4">
                    {managedEvents
                      .filter((event) => event.registrations.length > 0)
                      .map((event) => (
                        <div
                          key={event.id}
                          className="rounded-brand bg-surface-container-low px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-headline text-base font-semibold text-on-surface">
                                {event.title}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                                {event.registrationCount} inscription
                                {event.registrationCount > 1 ? "s" : ""} active
                                {event.registrationCount > 1 ? "s" : ""}
                              </p>
                            </div>
                            <EventKindBadge kind={event.eventKind} />
                          </div>

                          <div className="mt-4 space-y-3">
                            {event.registrations.map((registration) => (
                              <div
                                key={registration.id}
                                className="rounded-brand bg-surface-container-lowest px-4 py-4 text-sm leading-7 text-on-surface-variant shadow-ambient"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-on-surface">
                                    {registration.displayName}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-1 font-label text-[11px] font-semibold ${
                                      registration.status === "registered"
                                        ? "bg-secondary-container text-on-secondary-container"
                                        : "bg-surface-container text-on-surface-variant"
                                    }`}
                                  >
                                    {registration.status === "registered"
                                      ? "Inscrite"
                                      : "Annulée"}
                                  </span>
                                </div>
                                <p className="mt-2">
                                  Inscription enregistrée le{" "}
                                  {formatRegistrationDate(registration.createdAt)}
                                </p>
                                {registration.contactEmail ? (
                                  <p>Email: {registration.contactEmail}</p>
                                ) : null}
                                {registration.contactPhone ? (
                                  <p>Téléphone: {registration.contactPhone}</p>
                                ) : null}
                                {registration.note ? (
                                  <p className="mt-2">{registration.note}</p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Les inscriptions apparaîtront ici dès qu&apos;un format publié recevra
                    ses premières demandes.
                  </p>
                )}
              </div>

              <div className="surface-card space-y-3">
                <div className="flex items-center gap-3 text-primary">
                  <Video aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Repère de publication
                  </p>
                </div>
                <p className="text-base leading-8 text-on-surface-variant">
                  Un atelier ou un webinaire doit rester descriptif et prudent: indiquer
                  l&apos;objectif, le public visé et le cadre pratique, sans promesse de
                  résultat ni recommandation individualisée.
                </p>
              </div>
            </aside>
          </div>
      </section>
    </AppShell>
  );
}
