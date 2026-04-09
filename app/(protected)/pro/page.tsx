import Link from "next/link";
import { ArrowUpRight, BriefcaseMedical, CalendarDays, CircleCheckBig, UserRound } from "lucide-react";
import type { Route } from "next";

import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { SubscriptionBadge } from "@/components/pro/subscription-badge";
import { requireProfessional } from "@/lib/auth";
import { getProfessionalAgendaSnapshot } from "@/lib/professional-agenda";
import { getProfessionalCategoryLabel, getProfessionalProfileByUserId } from "@/lib/professional";

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

  const { upcomingAvailabilities, appointments } = await getProfessionalAgendaSnapshot(user.id);
  const pendingCount = appointments.filter((appointment) => appointment.status === "pending").length;
  const confirmedCount = appointments.filter((appointment) => appointment.status === "confirmed").length;
  const publicHref = `/professionnels/${professionalProfile.slug}`;

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

        <div className="surface-section space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="eyebrow">Tableau de bord professionnel</div>
              <div className="space-y-2">
                <h1 className="editorial-title">Piloter votre présence sans bruit ni surcharge.</h1>
                <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
                  Votre espace pro centralise la visibilité publique, l&apos;agenda et les
                  demandes reçues pour vous laisser une lecture simple de l&apos;essentiel.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubscriptionBadge tier={professionalProfile.subscriptionTier} />
              <Link
                href={publicHref as Route}
                className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                Voir ma fiche
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
              <p className="text-xs uppercase tracking-[0.16em] text-outline">Demandes en attente</p>
              <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{pendingCount}</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Rendez-vous à confirmer ou décliner.
              </p>
            </div>
            <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
              <p className="text-xs uppercase tracking-[0.16em] text-outline">Créneaux à venir</p>
              <p className="mt-2 font-headline text-3xl font-bold text-on-surface">
                {upcomingAvailabilities.length}
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Disponibilités déjà préparées dans votre agenda.
              </p>
            </div>
            <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
              <p className="text-xs uppercase tracking-[0.16em] text-outline">Rendez-vous confirmés</p>
              <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{confirmedCount}</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Consultations confirmées et visibles d&apos;un coup d&apos;oeil.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              <p className="text-sm leading-7 text-on-surface-variant">
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
              <p className="text-sm leading-7 text-on-surface-variant">
                Mettre à jour votre présentation, vos modalités de consultation et votre visibilité.
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
            <p className="text-sm leading-7 text-on-surface-variant">
              {professionalProfile.city
                ? `${professionalProfile.city}, ${professionalProfile.country}`
                : `Ouvert aux demandes en ${professionalProfile.country}`}
            </p>
            <div className="rounded-brand bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant">
              {professionalProfile.bio ?? "Ajoutez une présentation pour aider les patientes à comprendre votre approche."}
            </div>
          </div>

          <div className="surface-card space-y-3">
            <div className="flex items-center gap-3 text-primary">
              <CircleCheckBig aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              <p className="font-headline text-base font-semibold text-on-surface">À garder en tête</p>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-on-surface-variant">
              <li>Un créneau publié apparaît sur votre fiche publique.</li>
              <li>Les demandes restent en attente tant qu&apos;elles ne sont pas confirmées.</li>
              <li>Votre offre actuelle module surtout la visibilité, pas la complexité de l&apos;outil.</li>
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
