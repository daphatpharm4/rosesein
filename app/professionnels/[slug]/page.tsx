import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Globe, MapPin, Phone, Video } from "lucide-react";

import { AvailabilityPicker } from "@/components/pro/availability-picker";
import { SubscriptionBadge } from "@/components/pro/subscription-badge";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext } from "@/lib/auth";
import { getPublishedAvailabilities } from "@/lib/professional-agenda";
import {
  CONSULTATION_MODE_LABELS,
  getProfessionalBySlug,
  getProfessionalCategoryLabel,
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
  "booking-forbidden":
    "Ce compte ne peut pas envoyer de demande de rendez-vous depuis cette fiche.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfessionalProfilePage({
  params,
  searchParams,
}: ProfessionalProfilePageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const [profile, context] = await Promise.all([
    getProfessionalBySlug(slug),
    getCurrentUserContext(),
  ]);

  if (!profile) {
    notFound();
  }

  const availabilities =
    profile.subscriptionTier === "solidaire"
      ? []
      : await getPublishedAvailabilities(profile.id);
  const feedbackKey = error ?? status;
  const feedback = feedbackKey ? feedbackMap[feedbackKey] : null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const categoryLabel = getProfessionalCategoryLabel(profile);
  const headerTitle = profile.structureName ?? `${profile.title ? `${profile.title} ` : ""}${profile.displayName}`.trim();
  const viewerProfile = context.profile;
  const isAdminViewer = context.roles.includes("admin");
  const hasCompletedProfile = viewerProfile !== null;
  const canRequestAppointment =
    hasCompletedProfile
    && (isAdminViewer || viewerProfile.profileKind !== "professional")
    && profile.subscriptionTier !== "solidaire"
    && availabilities.length > 0;
  const requestAppointmentAction = requestAppointment.bind(null, slug, profile.id);

  return (
    <AppShell title="Professionnels" currentPath="/professionnels">
      <section className="space-y-6">
        <div className="surface-section space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="eyebrow">
                {profile.professionalKind === "medical" ? "Parcours médical" : "Soins de support"}
              </div>
              <div className="space-y-2">
                <h1 className="editorial-title">{headerTitle}</h1>
                <p className="text-base font-medium text-primary">{categoryLabel}</p>
                {profile.structureName ? (
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Interlocuteur référent: {profile.title ? `${profile.title} ` : ""}
                    {profile.displayName}
                  </p>
                ) : null}
              </div>
            </div>
            <SubscriptionBadge tier={profile.subscriptionTier} />
          </div>

          {profile.bio ? (
            <p className="max-w-2xl text-base leading-7 text-on-surface-variant">{profile.bio}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 text-sm leading-7 text-on-surface-variant">
            {profile.city ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-4 w-4 text-primary" strokeWidth={1.8} />
                {profile.city}, {profile.country}
              </span>
            ) : null}

            {profile.consultationModes.map((mode) => (
              <span key={mode} className="inline-flex items-center gap-1.5">
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

            {profile.consultationPriceEur !== null ? (
              <span className="font-semibold text-on-surface">
                {profile.consultationPriceEur} € / consultation
              </span>
            ) : null}

            {profile.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary"
              >
                <Globe aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Site web
              </a>
            ) : null}
          </div>
        </div>

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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section className="surface-section space-y-4">
              <div>
                <div className="eyebrow">Disponibilités</div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  Créneaux publiés
                </h2>
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
                        className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm leading-7 text-on-surface"
                        placeholder="Précisez brièvement votre besoin ou le contexte du rendez-vous."
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
                    >
                      Envoyer une demande de rendez-vous
                    </button>
                  </form>
                ) : (
                  <AvailabilityPicker availabilities={availabilities} />
                )
              ) : (
                <div className="rounded-brand bg-surface-container-lowest px-4 py-4 text-sm leading-7 text-on-surface-variant shadow-ambient">
                  Aucun créneau n&apos;est publié pour le moment. Le contact direct reste possible.
                </div>
              )}
            </section>

            <aside className="space-y-4">
              {!context.user ? (
                <div className="surface-card space-y-3">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Se connecter pour demander un rendez-vous
                  </p>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Les créneaux restent visibles publiquement, mais l&apos;envoi d&apos;une demande nécessite une session authentifiée.
                  </p>
                  <Link
                    href={`/account?status=signin-required&redirectTo=${encodeURIComponent(`/professionnels/${slug}`)}`}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                  >
                    Ouvrir mon compte
                  </Link>
                </div>
              ) : !viewerProfile ? (
                <div className="surface-card space-y-3">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Compléter le profil avant de réserver
                  </p>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    La demande de rendez-vous enregistre la personne qui prend contact. Il faut donc finaliser le profil avant l&apos;envoi.
                  </p>
                  <Link
                    href={`/account?status=complete-profile&redirectTo=${encodeURIComponent(`/professionnels/${slug}`)}`}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                  >
                    Compléter mon profil
                  </Link>
                </div>
              ) : viewerProfile.profileKind === "professional" ? (
                <div className="surface-card space-y-3">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    {isAdminViewer ? "Mode admin" : "Lecture seule depuis un compte pro"}
                  </p>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    {isAdminViewer
                      ? "Un compte administrateur peut tester le parcours, mais un profil complété reste nécessaire."
                      : "Les demandes de rendez-vous sont réservées aux patientes et aidants connectés."}
                  </p>
                </div>
              ) : null}

              <div className="surface-card space-y-3">
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Repère avant de réserver
                </p>
                <p className="text-sm leading-7 text-on-surface-variant">
                  Une demande n&apos;est pas confirmée immédiatement. Le professionnel la valide ensuite depuis son espace dédié.
                </p>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
