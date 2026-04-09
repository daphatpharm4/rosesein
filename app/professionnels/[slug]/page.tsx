import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Globe, MapPin, Phone, ShieldCheck, Video } from "lucide-react";

import { AvailabilityPicker } from "@/components/pro/availability-picker";
import { EventKindBadge } from "@/components/content/event-kind-badge";
import { SubscriptionBadge } from "@/components/pro/subscription-badge";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext } from "@/lib/auth";
import { formatEventSchedule } from "@/lib/content";
import { getPublishedEventsByProfessional } from "@/lib/events";
import {
  getPatientBookingRestriction,
  getPublishedAvailabilities,
} from "@/lib/professional-agenda";
import {
  CONSULTATION_MODE_LABELS,
  SUBSCRIPTION_TIER_DEFINITIONS,
  getProfessionalBySlug,
  getProfessionalCategoryLabel,
  trackProfessionalProfileView,
} from "@/lib/professional";

import { requestAppointment } from "./actions";

export const dynamic = "force-dynamic";

type ProfessionalProfilePageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "booking-requested":
    "Votre demande de rendez-vous a été envoyée. Le professionnel la confirmera depuis son espace dédié.",
  "booking-missing-slot": "Choisissez un créneau avant d'envoyer votre demande.",
  "booking-unavailable":
    "Ce créneau n'est plus disponible. Sélectionnez-en un autre ou contactez directement le professionnel.",
  "booking-temporarily-paused":
    "La réservation en ligne est temporairement suspendue après plusieurs annulations tardives.",
  "booking-forbidden":
    "Ce compte ne peut pas envoyer de demande de rendez-vous depuis cette fiche.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatResumeDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ProfessionalProfilePage({
  params,
  searchParams,
}: ProfessionalProfilePageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const resumeAt = firstValue(query.resumeAt);
  const [profile, context] = await Promise.all([
    getProfessionalBySlug(slug),
    getCurrentUserContext(),
  ]);

  if (!profile) {
    notFound();
  }

  const viewerProfile = context.profile;
  const isAdminViewer = context.roles.includes("admin");
  const [availabilities, hostedEvents, bookingRestriction] = await Promise.all([
    profile.subscriptionTier === "solidaire"
      ? Promise.resolve([])
      : getPublishedAvailabilities(profile.id),
    profile.subscriptionTier === "partenaire"
      ? getPublishedEventsByProfessional(profile.id, 3)
      : Promise.resolve([]),
    context.user && (isAdminViewer || viewerProfile?.profileKind !== "professional")
      ? getPatientBookingRestriction(context.user.id)
      : Promise.resolve(null),
  ]);
  const feedbackKey = error ?? status;
  const feedback = feedbackKey
    ? feedbackKey === "booking-temporarily-paused" && resumeAt
      ? `${feedbackMap[feedbackKey]} Vous pourrez réessayer à partir du ${formatResumeDate(resumeAt)} ou passer par un contact direct si besoin.`
      : feedbackMap[feedbackKey]
    : null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const categoryLabel = getProfessionalCategoryLabel(profile);
  const headerTitle = profile.structureName ?? `${profile.title ? `${profile.title} ` : ""}${profile.displayName}`.trim();
  const tierDefinition = SUBSCRIPTION_TIER_DEFINITIONS[profile.subscriptionTier];
  const hasCompletedProfile = viewerProfile !== null;
  const isBookingPaused = bookingRestriction?.isBlocked ?? false;
  const canRequestAppointment =
    hasCompletedProfile
    && (isAdminViewer || viewerProfile.profileKind !== "professional")
    && !isBookingPaused
    && profile.subscriptionTier !== "solidaire"
    && availabilities.length > 0;
  const requestAppointmentAction = requestAppointment.bind(null, slug, profile.id);

  await trackProfessionalProfileView(profile.id, context.user?.id ?? null);

  return (
    <AppShell title="Professionnels" currentPath="/professionnels">
      <section className="space-y-6">
        <div className="signature-profile-shell surface-section space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-3">
              <div className="eyebrow">
                {profile.professionalKind === "medical" ? "Parcours médical" : "Soins de support"}
              </div>
              <div className="space-y-2">
                <h1 className="editorial-title max-w-3xl">{headerTitle}</h1>
                <p className="max-w-2xl text-lg font-medium leading-8 text-primary">{categoryLabel}</p>
                {profile.structureName ? (
                  <p className="text-base leading-8 text-on-surface-variant">
                    Interlocuteur référent: {profile.title ? `${profile.title} ` : ""}
                    {profile.displayName}
                  </p>
                ) : null}
              </div>
            </div>
            <SubscriptionBadge tier={profile.subscriptionTier} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_20rem] lg:items-start">
            <div className="space-y-4">
              {profile.bio ? (
                <p className="max-w-2xl text-base leading-8 text-on-surface-variant">{profile.bio}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2.5 text-sm leading-7 text-on-surface-variant">
                {profile.consultationModes.map((mode) => (
                  <span
                    key={mode}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-3 py-1.5 shadow-ambient"
                  >
                    {mode === "visio" ? (
                      <Video aria-hidden="true" className="h-4 w-4 text-primary" strokeWidth={1.8} />
                    ) : mode === "telephone" ? (
                      <Phone aria-hidden="true" className="h-4 w-4 text-primary" strokeWidth={1.8} />
                    ) : (
                      <MapPin aria-hidden="true" className="h-4 w-4 text-primary" strokeWidth={1.8} />
                    )}
                    {CONSULTATION_MODE_LABELS[mode]}
                  </span>
                ))}
              </div>
            </div>

            <aside className="rounded-brand-xl border border-outline-variant/35 bg-surface-container-lowest/80 px-4 py-4 shadow-ambient backdrop-blur-sm">
              <p className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Cadre de consultation
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
                {profile.city ? (
                  <p className="inline-flex items-start gap-2">
                    <MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                    <span>{profile.city}, {profile.country}</span>
                  </p>
                ) : null}
                {profile.consultationPriceEur !== null ? (
                  <p className="font-semibold text-on-surface">
                    {profile.consultationPriceEur} € / consultation
                  </p>
                ) : (
                  <p>Tarif communiqué directement par le professionnel.</p>
                )}
                {profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-primary"
                  >
                    <Globe aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                    Ouvrir le site web
                  </a>
                ) : null}
              </div>
            </aside>
          </div>
        </div>

        {profile.subscriptionTier === "partenaire" ? (
          <div className="surface-card space-y-3 bg-secondary-container/30">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              <p className="font-headline text-lg font-semibold text-on-surface">
                {tierDefinition.publicHeadline}
              </p>
            </div>
            <p className="text-base leading-8 text-on-surface-variant">
              {tierDefinition.publicDescription}
            </p>
            <p className="text-xs leading-6 text-on-surface-variant">
              Cette mise en avant aide à repérer la fiche dans l&apos;écosystème ROSE-SEIN. Elle ne remplace ni votre appréciation personnelle, ni un avis médical individualisé.
            </p>
          </div>
        ) : null}

        {hostedEvents.length > 0 ? (
          <section className="surface-section space-y-4">
              <div>
                <div className="eyebrow">Formats collectifs</div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  Ateliers et webinaires publiés
                </h2>
              <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                Ces formats disposent d&apos;une page dédiée avec leurs propres inscriptions.
                Pour une consultation individuelle, utilisez l&apos;agenda ou le contact direct.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {hostedEvents.map((event) => (
                <article key={event.id} className="surface-card space-y-3">
                  <EventKindBadge kind={event.eventKind} />
                  <h3 className="font-headline text-lg font-semibold text-on-surface">
                    {event.title}
                  </h3>
                  <p className="text-base leading-8 text-on-surface-variant">
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
                  <Link
                    href={`/actualites/evenements/${event.id}`}
                    className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                  >
                    Voir le détail
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {feedback ? (
          <div className={`surface-card ${feedbackTone}`} role={error ? "alert" : "status"}>
            <p className="font-headline text-base font-semibold">Rendez-vous</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        {profile.subscriptionTier === "solidaire" ? (
          <div className="surface-card space-y-3">
            <div className="flex items-center gap-3 text-primary">
              <CalendarDays aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              <p className="font-headline text-lg font-semibold text-on-surface">Prise de contact</p>
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">
              Cette fiche propose une présence simple dans l&apos;annuaire. Le contact se fait directement avec le professionnel.
            </p>
            {profile.phone ? (
              <a
                href={`tel:${profile.phone}`}
                className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                <Phone aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                {profile.phone}
              </a>
            ) : null}
          </div>
        ) : null}

        {profile.subscriptionTier !== "solidaire" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <section className="surface-section space-y-4">
              <div>
                <div className="eyebrow">Disponibilités</div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  Créneaux publiés
                </h2>
                <p className="mt-2 max-w-2xl text-base leading-8 text-on-surface-variant">
                  La demande reste en attente tant que le professionnel ne l&apos;a pas confirmée. Les annulations côté patiente restent possibles en ligne jusqu&apos;à 24 heures avant un rendez-vous confirmé.
                </p>
              </div>

              {availabilities.length > 0 ? (
                canRequestAppointment ? (
                  <form action={requestAppointmentAction} className="space-y-4">
                    <AvailabilityPicker availabilities={availabilities} />
                    <label className="block space-y-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Mot utile pour le professionnel
                      </span>
                      <textarea
                        name="patientNote"
                        rows={4}
                        className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-base leading-7 text-on-surface sm:text-sm"
                        placeholder="Précisez brièvement votre besoin ou le contexte du rendez-vous."
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
                    >
                      Envoyer une demande de rendez-vous
                    </button>
                  </form>
                ) : (
                  <AvailabilityPicker availabilities={availabilities} />
                )
              ) : (
                <div className="rounded-brand bg-surface-container-lowest px-4 py-4 text-base leading-8 text-on-surface-variant shadow-ambient">
                  Aucun créneau n&apos;est publié pour le moment. Le contact direct reste possible.
                </div>
              )}
            </section>

            <aside className="space-y-4 lg:sticky lg:top-[calc(var(--safe-area-top)+6.5rem)]">
              {!context.user ? (
                <div className="surface-card space-y-3">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Se connecter pour demander un rendez-vous
                  </p>
                  <p className="text-base leading-8 text-on-surface-variant">
                    Les créneaux restent visibles publiquement, mais l&apos;envoi d&apos;une demande nécessite une session authentifiée.
                  </p>
                  <Link
                    href={`/account?status=signin-required&redirectTo=${encodeURIComponent(`/professionnels/${slug}`)}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                  >
                    Ouvrir mon compte
                  </Link>
                </div>
              ) : !viewerProfile ? (
                <div className="surface-card space-y-3">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Compléter le profil avant de réserver
                  </p>
                  <p className="text-base leading-8 text-on-surface-variant">
                    La demande de rendez-vous enregistre la personne qui prend contact. Il faut donc finaliser le profil avant l&apos;envoi.
                  </p>
                  <Link
                    href={`/account?status=complete-profile&redirectTo=${encodeURIComponent(`/professionnels/${slug}`)}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                  >
                    Compléter mon profil
                  </Link>
                </div>
              ) : viewerProfile.profileKind === "professional" ? (
                <div className="surface-card space-y-3">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    {isAdminViewer ? "Mode admin" : "Lecture seule depuis un compte pro"}
                  </p>
                  <p className="text-base leading-8 text-on-surface-variant">
                    {isAdminViewer
                      ? "Un compte administrateur peut tester le parcours, mais un profil complété reste nécessaire."
                      : "Les demandes de rendez-vous sont réservées aux patientes et aidants connectés."}
                    </p>
                </div>
              ) : isBookingPaused ? (
                <div className="surface-card space-y-3 bg-primary/6">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Réservation temporairement suspendue
                  </p>
                  <p className="text-base leading-8 text-on-surface-variant">
                    Deux annulations tardives sur 90 jours ferment momentanément la prise de rendez-vous en ligne pour protéger le cadre des créneaux confirmés.
                  </p>
                  {bookingRestriction?.pauseUntil ? (
                    <p className="text-sm leading-7 text-primary">
                      Réouverture prévue le {formatResumeDate(bookingRestriction.pauseUntil)}.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="surface-card space-y-3 bg-secondary-container/25">
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Avant de réserver
                </p>
                <p className="text-base leading-8 text-on-surface-variant">
                  Une demande n&apos;est pas confirmée immédiatement. Le professionnel la valide ensuite depuis son espace dédié.
                </p>
                <p className="text-sm leading-7 text-on-surface-variant">
                  Les annulations de dernière minute sont suivies pour protéger le cadre de prise de rendez-vous.
                </p>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
