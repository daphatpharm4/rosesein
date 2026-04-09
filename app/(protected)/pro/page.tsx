import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  CircleCheckBig,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { Route } from "next";

import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { SubscriptionBadge } from "@/components/pro/subscription-badge";
import { requireProfessional } from "@/lib/auth";
import { getProfessionalAgendaSnapshot } from "@/lib/professional-agenda";
import {
  SUBSCRIPTION_TIER_DEFINITIONS,
  getProfessionalCategoryLabel,
  getProfessionalPerformanceStats,
  getProfessionalProfileByUserId,
} from "@/lib/professional";

export const dynamic = "force-dynamic";

type ProDashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "profile-ready":
    "Votre espace professionnel est prêt. Vous pouvez maintenant publier votre fiche et organiser vos créneaux.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProDashboardPage({ searchParams }: ProDashboardPageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const { user } = await requireProfessional("/pro");
  const professionalProfile = await getProfessionalProfileByUserId(user.id);

  if (!professionalProfile) {
    return null;
  }

  const [
    { upcomingAvailabilities, appointments },
    partnerStats,
  ] = await Promise.all([
    getProfessionalAgendaSnapshot(user.id),
    professionalProfile.subscriptionTier === "partenaire"
      ? getProfessionalPerformanceStats(user.id)
      : Promise.resolve(null),
  ]);
  const pendingCount = appointments.filter((appointment) => appointment.status === "pending").length;
  const confirmedCount = appointments.filter((appointment) => appointment.status === "confirmed").length;
  const needsFirstStep = upcomingAvailabilities.length === 0 && appointments.length === 0;
  const publicHref = `/professionnels/${professionalProfile.slug}`;
  const tierDefinition = SUBSCRIPTION_TIER_DEFINITIONS[professionalProfile.subscriptionTier];

  return (
    <AppShell title="Espace pro" currentPath="/pro">
      <section className="space-y-6">
        <BackLink href="/account" label="Retour au compte" />

        {status && feedbackMap[status] ? (
          <div className="surface-card bg-secondary-container/70 text-on-secondary-container" role="status">
            <p className="font-headline text-base font-semibold">Espace professionnel</p>
            <p className="mt-2 text-sm leading-7">{feedbackMap[status]}</p>
          </div>
        ) : null}

        <div className="pro-hero-shell surface-section space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-3">
              <div className="eyebrow">Tableau de bord professionnel</div>
              <div className="space-y-2">
                <h1 className="editorial-title">Piloter votre présence sans bruit ni surcharge.</h1>
                <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                  Votre espace pro centralise la visibilité publique, l&apos;agenda et les
                  demandes reçues pour vous laisser une lecture simple de l&apos;essentiel.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubscriptionBadge tier={professionalProfile.subscriptionTier} />
              <Link
                href={publicHref as Route}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                Voir ma fiche
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-12">
            <div className="rounded-brand-xl bg-surface-container-lowest/95 px-5 py-5 shadow-ambient xl:col-span-5">
              <p className="text-xs uppercase tracking-[0.16em] text-outline">Demandes à traiter</p>
              <p className="mt-2 font-headline text-4xl font-bold text-on-surface">{pendingCount}</p>
              <p className="mt-2 max-w-sm text-sm leading-7 text-on-surface-variant">
                Les demandes en attente demandent une réponse claire pour libérer ou confirmer le créneau.
              </p>
            </div>
            <div className="rounded-brand-xl bg-surface-container-lowest/95 px-5 py-5 shadow-ambient xl:col-span-3">
              <p className="text-xs uppercase tracking-[0.16em] text-outline">Créneaux publiés</p>
              <p className="mt-2 font-headline text-4xl font-bold text-on-surface">
                {upcomingAvailabilities.length}
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Disponibilités déjà préparées dans votre agenda.
              </p>
            </div>
            <div className="rounded-brand-xl bg-surface-container-lowest/95 px-5 py-5 shadow-ambient xl:col-span-4">
              <p className="text-xs uppercase tracking-[0.16em] text-outline">Rendez-vous confirmés</p>
              <p className="mt-2 font-headline text-4xl font-bold text-on-surface">{confirmedCount}</p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Consultations validées et déjà actées dans le parcours patient.
              </p>
            </div>
          </div>
        </div>

        {needsFirstStep ? (
          <div className="surface-card space-y-4 bg-secondary-container/35">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <div className="eyebrow">Premier pas conseillé</div>
                <p className="font-headline text-xl font-semibold text-on-surface">
                  Commencez par publier un premier créneau.
                </p>
                <p className="text-base leading-8 text-on-surface-variant">
                  Tant qu&apos;aucun créneau n&apos;est visible, la fiche reste consultable mais ne peut pas ouvrir une vraie demande de rendez-vous.
                </p>
              </div>
              <Link
                href={"/pro/agenda" as Route}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                Ouvrir l&apos;agenda
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        ) : null}

        <div
          className={`grid gap-4 ${
            professionalProfile.subscriptionTier === "partenaire"
              ? "md:grid-cols-2 xl:grid-cols-3"
              : "sm:grid-cols-2"
          }`}
        >
          <Link
            href={"/pro/agenda" as Route}
            className="surface-card group flex items-start gap-4 transition-colors hover:border-primary/20 hover:bg-white"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarDays aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <p className="font-headline text-lg font-semibold text-on-surface group-hover:text-primary">
                Agenda professionnel
              </p>
              <p className="text-base leading-8 text-on-surface-variant">
                Publier des créneaux, surveiller les demandes et garder une vue nette sur les rendez-vous.
              </p>
            </div>
          </Link>

          <Link
            href={"/pro/profil" as Route}
            className="surface-card group flex items-start gap-4 transition-colors hover:border-primary/20 hover:bg-white"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <p className="font-headline text-lg font-semibold text-on-surface group-hover:text-primary">
                Fiche publique
              </p>
              <p className="text-base leading-8 text-on-surface-variant">
                Mettre à jour votre présentation, vos modalités de consultation et votre visibilité.
              </p>
            </div>
          </Link>

          <Link
            href={"/pro/ateliers" as Route}
            className="surface-card group flex items-start gap-4 transition-colors hover:border-primary/20 hover:bg-white"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-primary">
              <CalendarRange aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <p className="font-headline text-lg font-semibold text-on-surface group-hover:text-primary">
                Ateliers et webinaires
              </p>
              <p className="text-base leading-8 text-on-surface-variant">
                {professionalProfile.subscriptionTier === "partenaire"
                  ? "Créer une page d'inscription dédiée pour vos formats collectifs et suivre les participantes."
                  : "Voir ce que débloque l'offre Partenaire pour publier des formats collectifs."}
              </p>
            </div>
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="surface-card space-y-4">
            <div className="eyebrow">Repères actuels</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              {getProfessionalCategoryLabel(professionalProfile)}
            </h2>
            <p className="text-base leading-8 text-on-surface-variant">
              {professionalProfile.city
                ? `${professionalProfile.city}, ${professionalProfile.country}`
                : `Ouvert aux demandes en ${professionalProfile.country}`}
            </p>
            <div className="rounded-brand bg-surface-container-low px-4 py-4 text-base leading-8 text-on-surface-variant">
              {professionalProfile.bio ?? "Ajoutez une présentation pour aider les patientes à comprendre votre approche."}
            </div>
          </div>

          <div className="surface-card space-y-3">
            <div className="flex items-center gap-3 text-primary">
              <CircleCheckBig aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              <p className="font-headline text-base font-semibold text-on-surface">À garder en tête</p>
            </div>
            <ul className="space-y-3 text-base leading-8 text-on-surface-variant">
              <li>Un créneau publié apparaît sur votre fiche publique.</li>
              <li>Les demandes restent en attente tant qu&apos;elles ne sont pas confirmées.</li>
              <li>Les annulations exigent désormais un motif, et les désistements tardifs sont tracés.</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
          <div className="surface-section space-y-5">
            <div className="space-y-2">
              <div className="eyebrow">Offre active</div>
              <h2 className="font-headline text-2xl font-bold text-on-surface">
                {tierDefinition.dashboardHeadline}
              </h2>
              <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                {tierDefinition.dashboardDescription}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {tierDefinition.benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-brand bg-surface-container-lowest px-4 py-4 text-base leading-8 text-on-surface-variant shadow-ambient"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {professionalProfile.subscriptionTier === "partenaire" && partnerStats ? (
            <div className="surface-section space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <TrendingUp aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Indicateurs partenaire
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
                  <p className="text-xs uppercase tracking-[0.16em] text-outline">Ouvertures de fiche · 30 jours</p>
                  <p className="mt-2 font-headline text-3xl font-bold text-on-surface">
                    {partnerStats.profileViews30d}
                  </p>
                </div>
                <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
                  <p className="text-xs uppercase tracking-[0.16em] text-outline">Demandes reçues · 30 jours</p>
                  <p className="mt-2 font-headline text-3xl font-bold text-on-surface">
                    {partnerStats.appointmentRequests30d}
                  </p>
                </div>
                <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
                  <p className="text-xs uppercase tracking-[0.16em] text-outline">Taux de confirmation</p>
                  <p className="mt-2 font-headline text-3xl font-bold text-on-surface">
                    {partnerStats.confirmationRate}%
                  </p>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    {partnerStats.confirmedAppointments30d} demande(s) confirmée(s) sur la période.
                  </p>
                </div>
              </div>

              <p className="text-xs leading-6 text-on-surface-variant">
                Les indicateurs partenaires décrivent l&apos;activité observée sur les 30 derniers jours. Ils servent de repère éditorial, pas de classement médical.
              </p>
            </div>
          ) : (
            <div className="surface-section space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Ce que débloque Partenaire
                </p>
              </div>

              <div className="space-y-3">
                {SUBSCRIPTION_TIER_DEFINITIONS.partenaire.benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="rounded-brand bg-surface-container-lowest px-4 py-4 text-base leading-8 text-on-surface-variant shadow-ambient"
                  >
                    {benefit}
                  </div>
                ))}
              </div>

              <div className="rounded-brand bg-secondary-container/35 px-4 py-4 text-base leading-8 text-on-surface-variant">
                L&apos;offre partenaire ajoute une vraie différence visible côté patient: mise en avant sur l&apos;accueil, formats collectifs publiés, signal renforcé dans l&apos;annuaire et lecture simple des indicateurs.
              </div>
            </div>
          )}
        </div>

        {professionalProfile.subscriptionTier === "partenaire" ? (
          <div className="surface-card flex flex-wrap items-start justify-between gap-4 bg-secondary-container/35">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em]">
                  Mise en avant active
                </span>
              </div>
              <p className="font-headline text-lg font-semibold text-on-surface">
                Votre fiche peut remonter dans l&apos;accueil ROSE-SEIN.
              </p>
              <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                La mise en avant partenaire rend votre présence plus visible dans les points d&apos;entrée publics et vous permet aussi de publier des ateliers ou webinaires distincts de vos consultations individuelles.
              </p>
            </div>
            <Link
              href={"/pro/ateliers" as Route}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-primary shadow-ambient"
            >
              Gérer mes formats
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
