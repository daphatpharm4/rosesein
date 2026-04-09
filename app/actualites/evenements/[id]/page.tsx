import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarRange, CheckCircle2, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { EventKindBadge } from "@/components/content/event-kind-badge";
import { RevealScene } from "@/components/motion/reveal-scene";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext } from "@/lib/auth";
import { EVENT_KIND_LABELS, formatEventSchedule } from "@/lib/content";
import { getCurrentUserEventRegistration, getPublishedEventById, isEventClosed } from "@/lib/events";

import { cancelEventRegistration, registerForEvent } from "./actions";

export const dynamic = "force-dynamic";

const feedbackMap: Record<string, string> = {
  "registration-saved": "Votre inscription a bien été enregistrée.",
  "registration-cancelled": "Votre inscription a été annulée.",
  "event-not-found": "Cet événement n'est plus disponible.",
  "event-closed": "Les inscriptions sont closes pour cet événement.",
  "registration-failed": "L'inscription n'a pas pu être enregistrée.",
  "cancellation-failed": "L'annulation n'a pas pu être enregistrée.",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatRegistrationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getPublishedEventById(id);

  if (!event) {
    return { title: "Événement introuvable" };
  }

  return {
    title: event.title,
    description: event.description,
  };
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const feedback = feedbackMap[error ?? status ?? ""] ?? null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const event = await getPublishedEventById(id);

  if (!event) {
    notFound();
  }

  const [{ user, profile }, registration] = await Promise.all([
    getCurrentUserContext(),
    getCurrentUserEventRegistration(id),
  ]);
  const closed = isEventClosed(event.startsAt);
  const hasActiveRegistration = registration?.status === "registered";
  const isProfessionalFormat = event.eventKind !== "evenement" && Boolean(event.professionalId);
  const registrationHeading =
    event.eventKind === "atelier"
      ? "S'inscrire à cet atelier"
      : event.eventKind === "webinaire"
        ? "S'inscrire à ce webinaire"
        : "Réserver votre place";
  const registrationHelper = isProfessionalFormat
    ? "L'inscription concerne ce format collectif. Pour une consultation individuelle, repassez par la fiche du professionnel."
    : "L'inscription vous réserve une place sur cet événement publié par l'association.";
  const noteLabel = isProfessionalFormat ? "Message pour l'intervenant" : "Message pour l'équipe";
  const statusHeading =
    event.eventKind === "evenement" ? "Événement" : EVENT_KIND_LABELS[event.eventKind];
  const registeredHeading =
    event.eventKind === "atelier"
      ? "Vous êtes inscrite à cet atelier"
      : event.eventKind === "webinaire"
        ? "Vous êtes inscrite à ce webinaire"
        : "Vous êtes inscrite à cet événement";

  return (
    <AppShell title="Actualités" currentPath="/actualites">
      <RevealScene>
        <section className="space-y-6">
          <div data-reveal="section" style={{ ["--reveal-delay" as string]: "30ms" }}>
            <Link
              href={"/actualites" as Route}
              className="motion-link-row inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              Retour aux actualités
            </Link>
          </div>

          <div
            className="event-hero-shell surface-section space-y-4"
            data-reveal="section"
            style={{ ["--reveal-delay" as string]: "110ms" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <CalendarRange aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">{EVENT_KIND_LABELS[event.eventKind]}</p>
                <EventKindBadge kind={event.eventKind} />
              </div>
            </div>
            <h1 className="editorial-title">{event.title}</h1>
            <p className="text-base leading-8 text-on-surface-variant">{event.description}</p>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-on-surface">{formatEventSchedule(event)}</p>
              {event.locationLabel ? (
                <p className="text-on-surface-variant">{event.locationLabel}</p>
              ) : null}
            </div>
            {event.hostProfessionalName && event.hostProfessionalSlug ? (
              <div className="rounded-brand bg-surface-container-low px-4 py-4">
                <p className="font-headline text-base font-semibold text-on-surface">
                  Animé par {event.hostProfessionalTitle ? `${event.hostProfessionalTitle} ` : ""}
                  {event.hostProfessionalName}
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Cette page décrit un format collectif. La fiche professionnelle reste le bon
                  point d&apos;entrée pour une demande de consultation individuelle.
                </p>
                <Link
                  href={`/professionnels/${event.hostProfessionalSlug}` as Route}
                  className="mt-3 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                >
                  Voir la fiche professionnelle
                </Link>
              </div>
            ) : null}
          </div>

          {feedback ? (
            <div
              className={`surface-card ${feedbackTone}`}
              role={error ? "alert" : "status"}
              aria-live={error ? "assertive" : "polite"}
              data-reveal="section"
              style={{ ["--reveal-delay" as string]: "170ms" }}
            >
              <p className="font-headline text-base font-semibold">{statusHeading}</p>
              <p className="mt-2 text-sm leading-7">{feedback}</p>
            </div>
          ) : null}

          {hasActiveRegistration ? (
            <section
              className="surface-card space-y-4"
              data-reveal="section"
              style={{ ["--reveal-delay" as string]: "220ms" }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="font-headline text-lg font-semibold text-on-surface">
                    {registeredHeading}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    Inscription enregistrée le {formatRegistrationDate(registration.createdAt)}.
                  </p>
                </div>
              </div>

              <dl className="grid gap-3 text-sm leading-7 text-on-surface-variant md:grid-cols-2">
                <div>
                  <dt className="font-semibold text-on-surface">Email</dt>
                  <dd>{registration.contactEmail ?? user?.email ?? "Non renseigné"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-on-surface">Téléphone</dt>
                  <dd>{registration.contactPhone ?? "Non renseigné"}</dd>
                </div>
                {registration.note ? (
                  <div className="md:col-span-2">
                    <dt className="font-semibold text-on-surface">Note transmise</dt>
                    <dd>{registration.note}</dd>
                  </div>
                ) : null}
              </dl>

              {!closed ? (
                <form action={cancelEventRegistration}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <button
                    type="submit"
                    className="motion-cta w-full rounded-full bg-surface-container-low px-5 py-3 font-label text-sm font-semibold text-on-surface sm:w-auto"
                  >
                    Annuler mon inscription
                  </button>
                </form>
              ) : null}
            </section>
          ) : user && profile ? (
            closed ? (
              <div
                className="surface-card"
                data-reveal="section"
                style={{ ["--reveal-delay" as string]: "220ms" }}
              >
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Les inscriptions sont closes
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  L'événement a déjà commencé ou est passé. L'association peut encore partager un
                  compte-rendu via les actualités si besoin.
                </p>
              </div>
            ) : (
              <section
                className="space-y-4"
                data-reveal="section"
                style={{ ["--reveal-delay" as string]: "220ms" }}
              >
                <div>
                  <div className="eyebrow">Inscription</div>
                  <h2 className="font-headline text-2xl font-bold text-on-surface">
                    {registrationHeading}
                  </h2>
                  <p className="mt-2 max-w-2xl text-base leading-8 text-on-surface-variant">
                    {registrationHelper}
                  </p>
                </div>

                <form action={registerForEvent} className="surface-section space-y-5">
                  <input type="hidden" name="eventId" value={event.id} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Email de contact
                      </span>
                      <input
                        type="email"
                        name="contactEmail"
                        defaultValue={registration?.contactEmail ?? user.email ?? ""}
                        className="motion-field w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Téléphone
                      </span>
                      <input
                        type="tel"
                        name="contactPhone"
                        defaultValue={registration?.contactPhone ?? ""}
                        className="motion-field w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                        placeholder="Optionnel"
                      />
                    </label>
                  </div>

                  <label className="block space-y-2">
                    <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      {noteLabel}
                    </span>
                    <textarea
                      name="note"
                      rows={5}
                      defaultValue={registration?.note ?? ""}
                      className="motion-field w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm leading-7 text-on-surface placeholder:text-outline"
                      placeholder={
                        isProfessionalFormat
                          ? "Question pratique, besoin d'accessibilité ou précision utile avant la session."
                          : "Besoin d'accessibilité, question pratique, ou simple précision sur votre venue."
                      }
                    />
                  </label>

                  <button
                    type="submit"
                    className="motion-cta inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
                  >
                    <Sparkles aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                    Confirmer mon inscription
                  </button>
                </form>
              </section>
            )
          ) : user ? (
            <div
              className="surface-card space-y-3"
              data-reveal="section"
              style={{ ["--reveal-delay" as string]: "220ms" }}
            >
              <p className="font-headline text-lg font-semibold text-on-surface">
                Complétez d'abord votre profil
              </p>
              <p className="text-sm leading-7 text-on-surface-variant">
                L'association doit pouvoir vous identifier correctement avant de suivre votre
                inscription.
              </p>
              <Link
                href={`/account?status=complete-profile&redirectTo=${encodeURIComponent(`/actualites/evenements/${event.id}`)}` as Route}
                className="motion-cta inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
              >
                Finaliser mon profil
              </Link>
            </div>
          ) : (
            <div
              className="surface-card space-y-3"
              data-reveal="section"
              style={{ ["--reveal-delay" as string]: "220ms" }}
            >
              <p className="font-headline text-lg font-semibold text-on-surface">
                Connectez-vous pour vous inscrire
              </p>
              <p className="text-sm leading-7 text-on-surface-variant">
                Votre espace privé permet à l'association de retrouver votre demande sans perdre le contexte.
              </p>
              <Link
                href={`/account?redirectTo=${encodeURIComponent(`/actualites/evenements/${event.id}`)}` as Route}
                className="motion-cta inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
              >
                Se connecter
              </Link>
            </div>
          )}
        </section>
      </RevealScene>
    </AppShell>
  );
}
