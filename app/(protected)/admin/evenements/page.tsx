import Link from "next/link";
import { CalendarRange, Eye, EyeOff, PencilLine, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { EventKindBadge } from "@/components/content/event-kind-badge";
import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { requireStaff } from "@/lib/auth";
import { formatEventSchedule } from "@/lib/content";
import { formatEventDateTimeInput, getAdminEventsSnapshot } from "@/lib/events";

import { saveAdminEvent, toggleAdminEventPublish } from "./actions";

export const metadata: Metadata = { title: "Événements" };
export const dynamic = "force-dynamic";

const feedbackMap: Record<string, string> = {
  "event-created": "L'événement a été créé.",
  "event-updated": "L'événement a été mis à jour.",
  "event-published": "L'événement est maintenant publié.",
  "event-unpublished": "L'événement a été retiré des surfaces publiques.",
  "event-invalid": "Complétez le titre, la description et la date de début.",
  "event-datetime-invalid": "Le format de date ou d'heure est invalide.",
  "event-end-before-start": "La fin doit être postérieure au début.",
  "event-not-found": "L'événement demandé est introuvable.",
  "event-save-failed": "L'événement n'a pas pu être enregistré.",
  "event-publish-failed": "Le changement de publication a échoué.",
};

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

export default async function AdminEventsPage({ searchParams }: Props) {
  await requireStaff("/admin/evenements");

  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const edit = firstValue(query.edit);
  const feedback = feedbackMap[error ?? status ?? ""] ?? null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const events = await getAdminEventsSnapshot();
  const eventToEdit = edit ? events.find((event) => event.id === edit) ?? null : null;

  return (
    <AppShell title="Administration" currentPath="/admin" wide>
      <section className="space-y-6">
        <BackLink href="/admin" label="Retour à l'administration" />

        <div className="space-y-3">
          <div className="eyebrow">Programmation</div>
          <h1 className="editorial-title">Créer, publier et suivre les événements, ateliers et webinaires.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Les modérateurs et admins peuvent préparer un brouillon associatif, suivre les
            formats collectifs partenaires et relire les inscriptions depuis cette même surface.
          </p>
        </div>

        {feedback ? (
          <div
            className={`surface-card ${feedbackTone}`}
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
          >
            <p className="font-headline text-base font-semibold">Événements</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-lg font-semibold text-on-surface">
                {eventToEdit ? "Mettre à jour l'événement" : "Nouvel événement"}
              </h2>
              <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                Les heures saisies sont interprétées en heure de Paris.
              </p>
            </div>
            {eventToEdit ? (
              <Link
                href={"/admin/evenements" as Route}
                className="rounded-full bg-surface-container-low px-4 py-2 font-label text-sm font-semibold text-on-surface"
              >
                Nouveau brouillon
              </Link>
            ) : null}
          </div>

          <form action={saveAdminEvent} className="surface-section space-y-5">
            <input type="hidden" name="eventId" value={eventToEdit?.id ?? ""} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Titre
                </span>
                <input
                  type="text"
                  name="title"
                  required
                  minLength={4}
                  defaultValue={eventToEdit?.title ?? ""}
                  placeholder="Atelier nutrition après traitement"
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
                  Lieu ou modalité
                </span>
                <input
                  type="text"
                  name="locationLabel"
                  defaultValue={eventToEdit?.locationLabel ?? ""}
                  placeholder="En visio · Zoom"
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
                  placeholder="Expliquez l'objectif, le public concerné et les modalités pratiques."
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm leading-7 text-on-surface placeholder:text-outline"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-brand bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
              <input
                type="checkbox"
                name="publishNow"
                defaultChecked={eventToEdit ? eventToEdit.isPublished : true}
                className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
              />
              Publier dès l'enregistrement
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-label text-sm font-semibold text-on-primary"
              >
                <CalendarRange aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                {eventToEdit ? "Mettre à jour" : "Créer l'événement"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div>
            <div className="eyebrow">Suivi</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Événements et inscriptions
            </h2>
          </div>

          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <article key={event.id} className="surface-card space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
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
                      <h3 className="font-headline text-lg font-semibold text-on-surface">
                        {event.title}
                      </h3>
                      {event.hostProfessionalName ? (
                        <p className="text-xs uppercase tracking-[0.16em] text-outline">
                          Porté par {event.hostProfessionalTitle ? `${event.hostProfessionalTitle} ` : ""}
                          {event.hostProfessionalName}
                        </p>
                      ) : null}
                      <p className="text-sm leading-7 text-on-surface-variant">
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

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/evenements?edit=${event.id}` as Route}
                        className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2.5 font-label text-sm font-semibold text-on-surface"
                      >
                        <PencilLine aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                        Modifier
                      </Link>

                      <form action={toggleAdminEventPublish}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2.5 font-label text-sm font-semibold text-on-surface"
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
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 font-label text-sm font-semibold text-on-primary"
                        >
                          Voir la page publique
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-brand bg-surface-container-low px-4 py-4">
                    <div className="flex items-center gap-2">
                      <UsersRound aria-hidden="true" className="h-4 w-4 text-primary" strokeWidth={1.8} />
                      <p className="font-headline text-base font-semibold text-on-surface">
                        {event.registrationCount} inscription
                        {event.registrationCount > 1 ? "s" : ""} active
                        {event.registrationCount > 1 ? "s" : ""}
                      </p>
                    </div>

                    {event.registrations.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {event.registrations.map((registration) => (
                          <div
                            key={registration.id}
                            className="rounded-brand bg-surface-container-lowest px-4 py-4 text-sm leading-7 text-on-surface-variant"
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
                                {registration.status === "registered" ? "Inscrite" : "Annulée"}
                              </span>
                            </div>
                            <p className="mt-2">
                              Inscription enregistrée le {formatRegistrationDate(registration.createdAt)}
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
                    ) : (
                      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                        Aucune inscription pour le moment.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-section">
              <p className="font-headline text-base font-semibold text-on-surface">
                Aucun événement enregistré
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Créez votre premier événement depuis le formulaire ci-dessus.
              </p>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
