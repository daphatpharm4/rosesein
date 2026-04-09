import Link from "next/link";
import type { Route } from "next";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BriefcaseMedical,
  CalendarHeart,
  HandHeart,
  HeartHandshake,
  MessageCircleHeart,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { EventKindBadge } from "@/components/content/event-kind-badge";
import { ProfessionalCard } from "@/components/pro/professional-card";
import { HomeExperience } from "@/components/home/home-experience";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext } from "@/lib/auth";
import type { ProfileKind, UserProfile } from "@/lib/auth";
import { getActiveAssociationMessage } from "@/lib/association-message";
import {
  formatEventSchedule,
  formatPublishedDate,
  getPublicContentSnapshot,
} from "@/lib/content";
import { getFeaturedPartnerProfessionals } from "@/lib/professional";

type Shortcut = {
  title: string;
  description: string;
  href: Route;
  icon: typeof MessageCircleHeart;
  tone: string;
};

type RecommendedNextStep = {
  title: string;
  description: string;
  href: Route;
  cta: string;
};

function getShortcuts(profileKind: ProfileKind | undefined): Shortcut[] {
  const parcoursShortcut: Shortcut =
    profileKind === "caregiver"
      ? {
          title: "Accompagner au quotidien",
          description:
            "Gardez rendez-vous, notes et repères utiles pour la personne que vous soutenez.",
          href: "/parcours" as Route,
          icon: HandHeart,
          tone: "bg-tertiary/20 text-on-surface",
        }
      : {
          title: "Mon parcours",
          description:
            "Retrouvez vos rendez-vous, vos notes et vos documents personnels dans un même fil.",
          href: "/parcours" as Route,
          icon: CalendarHeart,
          tone: "bg-tertiary/20 text-on-surface",
        };

  return [
    {
      title: "Messagerie",
      description:
        "Retrouvez l'association, vos groupes de parole et vos échanges directs dans un seul endroit.",
      href: "/messages" as Route,
      icon: MessageCircleHeart,
      tone: "bg-primary/10 text-primary",
    },
    {
      title: "Actualités validées",
      description:
        "Consultez les contenus vérifiés sur les traitements, le quotidien et les événements.",
      href: "/actualites" as Route,
      icon: Newspaper,
      tone: "bg-secondary-container text-on-secondary-container",
    },
    {
      title: "Trouver un professionnel",
      description:
        "Parcourez l'annuaire, consultez les créneaux publiés et demandez un rendez-vous depuis une fiche dédiée.",
      href: "/professionnels" as Route,
      icon: BriefcaseMedical,
      tone: "bg-sage-container text-on-sage",
    },
    parcoursShortcut,
    {
      title: "Soutiens et ressources",
      description:
        "Nutrition, bien-être, groupes de parole et aides pratiques restent accessibles à tout moment.",
      href: "/association" as Route,
      icon: HeartHandshake,
      tone: "bg-primary-container/25 text-primary",
    },
  ];
}

function getRecommendedNextStep(
  userPresent: boolean,
  profile: UserProfile | null,
  difficultDayMode: boolean,
): RecommendedNextStep {
  if (!userPresent) {
    return {
      title: "Entrer dans votre espace privé.",
      description:
        "Commencez par votre compte pour retrouver la messagerie, le parcours et les futurs espaces personnels sur n'importe quel appareil.",
      href: "/account" as Route,
      cta: "Se connecter",
    };
  }

  if (!profile) {
    return {
      title: "Finaliser votre profil en une étape.",
      description:
        "Deux informations suffisent pour ouvrir les espaces privés et adapter l'expérience à votre situation.",
      href: "/account" as Route,
      cta: "Completer mon profil",
    };
  }

  if (difficultDayMode) {
    return {
      title: "Reprendre les échanges les plus utiles.",
      description:
        "Ouvrez d'abord votre messagerie pour retrouver un contact de confiance, puis revenez au reste seulement si vous en avez l'énergie.",
      href: "/messages" as Route,
      cta: "Ouvrir la messagerie",
    };
  }

  if (profile.profileKind === "caregiver") {
    return {
      title: "Reprendre la coordination du jour.",
      description:
        "Les messages et repères importants sont le chemin le plus direct pour organiser la suite avec sérénité.",
      href: "/messages" as Route,
      cta: "Voir mes messages",
    };
  }

  return {
    title: "Garder votre parcours lisible.",
    description:
      "Retrouvez vos prochains rendez-vous, vos notes et vos documents personnels avant de rouvrir le reste.",
    href: "/parcours" as Route,
    cta: "Ouvrir mon parcours",
  };
}

const WELLNESS_TIPS = [
  "Aujourd'hui, accordez-vous une pause sans écrans. Même 10 minutes font la différence.",
  "Boire un grand verre d'eau le matin aide le corps à démarrer plus doucement.",
  "Un geste de douceur envers vous-même compte autant qu'un rendez-vous médical.",
  "La respiration lente active le système nerveux parasympathique. Essayez 4 secondes / 4 secondes.",
  "Dire non à quelque chose d'épuisant, c'est dire oui à votre énergie.",
  "Une courte promenade, même lente, change l'état d'esprit.",
  "Notez une chose qui s'est bien passée aujourd'hui, aussi petite soit-elle.",
  "Le repos n'est pas de la paresse. C'est une partie du soin.",
  "Demander de l'aide est un acte de courage, pas de faiblesse.",
  "Votre corps fait un travail immense. Remerciez-le à votre façon.",
  "Manger quelque chose que vous aimez, c'est déjà prendre soin de vous.",
  "Aujourd'hui, une seule chose à la fois suffit.",
  "Un échange avec quelqu'un de confiance peut alléger le poids du quotidien.",
  "Vous traversez quelque chose de difficile. C'est réel, et votre ressenti est valide.",
];

export const revalidate = 300;

function formatExpiryDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(
    new Date(value),
  );
}

function revealDelay(value: string): CSSProperties {
  return { ["--reveal-delay" as string]: value };
}

export default async function HomePage() {
  const [{ configured, latestArticle, nextEvent }, { user, profile }, associationMessage, featuredPartners] =
    await Promise.all([
      getPublicContentSnapshot(),
      getCurrentUserContext(),
      getActiveAssociationMessage(),
      getFeaturedPartnerProfessionals(3),
    ]);

  const displayName = profile ? profile.pseudonym ?? profile.displayName : null;
  const difficultDayMode = profile?.difficultDayMode ?? false;
  const todayTip = WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length];
  const shortcuts = getShortcuts(profile?.profileKind);
  const nextStep = getRecommendedNextStep(Boolean(user), profile, difficultDayMode);

  return (
    <AppShell currentPath="/">
      <HomeExperience>
        <section className="space-y-10">
          <div
            className="max-w-3xl space-y-3"
            data-reveal="hero"
            style={revealDelay("40ms")}
          >
            <div className="eyebrow">Accueil</div>
            <div className="space-y-4 border-b border-outline-variant/40 pb-8">
              {displayName ? (
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Bonjour, {displayName}
                </p>
              ) : null}
              <h1 className="editorial-title max-w-2xl">
                {difficultDayMode
                  ? "Un repère simple pour aujourd'hui."
                  : "Un seul prochain pas, puis le reste quand vous serez prête."}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                {profile
                  ? todayTip
                  : "ROSE-SEIN rassemble information validée, soutien humain et organisation personnelle dans un espace plus calme qu'un outil médical classique."}
              </p>
            </div>
          </div>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-start">
            <div
              className="home-hero-shell surface-section space-y-6"
              data-home-hero
              data-reveal="hero"
              style={revealDelay("160ms")}
            >
              <div aria-hidden="true" className="home-hero-orbit" />
              <div
                aria-hidden="true"
                className="home-hero-orbit home-hero-orbit-secondary"
              />

              <div className="relative z-10 space-y-5">
                <div className="home-hero-accent">
                  <Sparkles aria-hidden="true" className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  <span className="font-label text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Votre prochain pas
                  </span>
                </div>

                <div className="space-y-3">
                  <h2 className="max-w-2xl font-headline text-3xl font-bold text-on-surface sm:text-4xl">
                    {nextStep.title}
                  </h2>
                  <p className="max-w-xl text-base leading-8 text-on-surface-variant">
                    {nextStep.description}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href={nextStep.href}
                    className="motion-cta inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
                  >
                    {nextStep.cta}
                    <ArrowRight
                      aria-hidden="true"
                      className="motion-link-arrow h-4 w-4"
                      strokeWidth={2}
                    />
                  </Link>
                  <Link
                    href={"/aide" as Route}
                    className="motion-cta inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-low px-5 py-3 font-label text-sm font-semibold text-primary sm:w-auto"
                  >
                    Trouver un repère ou une aide
                  </Link>
                </div>
              </div>
            </div>

            <aside
              className="home-rail border-t border-outline-variant/30 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
              data-reveal="hero"
              style={revealDelay("280ms")}
            >
              <div className="flex items-center gap-3">
                <Sparkles aria-hidden="true" className="h-5 w-5 text-tertiary" strokeWidth={1.8} />
                <p className="font-headline text-lg font-semibold text-on-surface">
                  En ce moment
                </p>
              </div>

              {associationMessage ? (
                <div className="mt-4 space-y-3">
                  <p className="font-headline text-xl font-semibold text-on-surface">
                    {associationMessage.title}
                  </p>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    {associationMessage.body}
                  </p>
                  <p className="font-label text-xs uppercase tracking-[0.16em] text-outline">
                    Jusqu&apos;au {formatExpiryDate(associationMessage.expiresAt)}
                  </p>
                </div>
              ) : latestArticle ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {latestArticle.category}
                  </p>
                  <p className="font-headline text-xl font-semibold text-on-surface">
                    {latestArticle.title}
                  </p>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    {latestArticle.summary}
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-outline">
                      Publié le {formatPublishedDate(latestArticle.publishedAt)}
                    </p>
                    <Link
                      href={`/actualites/${latestArticle.slug}`}
                      className="motion-link-row inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                    >
                      Lire l&apos;article
                      <ArrowRight
                        aria-hidden="true"
                        className="motion-link-arrow h-4 w-4"
                        strokeWidth={2}
                      />
                    </Link>
                  </div>
                </div>
              ) : nextEvent ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <EventKindBadge kind={nextEvent.eventKind} />
                    {nextEvent.hostProfessionalName ? (
                      <span className="text-sm text-on-surface-variant">
                        Animé par {nextEvent.hostProfessionalName}
                      </span>
                    ) : null}
                  </div>
                  <p className="font-headline text-xl font-semibold text-on-surface">
                    {nextEvent.title}
                  </p>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    {formatEventSchedule(nextEvent)}
                  </p>
                  {nextEvent.locationLabel ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-outline">
                      {nextEvent.locationLabel}
                    </p>
                  ) : null}
                  <Link
                    href={`/actualites/evenements/${nextEvent.id}` as Route}
                    className="motion-link-row inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                  >
                    Voir le détail
                    <ArrowRight
                      aria-hidden="true"
                      className="motion-link-arrow h-4 w-4"
                      strokeWidth={2}
                    />
                  </Link>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                  {configured
                    ? "Aucun contenu mis en avant pour le moment. L'accueil reste volontairement léger."
                    : "Configurez Supabase pour afficher ici les contenus publics et les événements à venir."}
                </p>
              )}
            </aside>
          </section>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
            <div
              className="space-y-4"
              data-reveal="section"
              style={revealDelay("120ms")}
            >
              <div>
                <div className="eyebrow">Autres accès</div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  Quand vous en avez besoin, tout le reste reste à portée.
                </h2>
              </div>

              <div className="home-list divide-y divide-outline-variant/25 border-b border-outline-variant/30 pt-px">
                {shortcuts.map(({ title, description, href, icon: Icon, tone }) => (
                  <Link
                    key={title}
                    href={href}
                    className="motion-link-row group flex items-start gap-4 py-5 hover:text-on-surface"
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}>
                      <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-headline text-lg font-semibold text-on-surface">
                        {title}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                        {description}
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="motion-link-arrow mt-1 h-4 w-4 shrink-0 text-primary"
                      strokeWidth={2}
                    />
                  </Link>
                ))}
              </div>
            </div>

            <aside
              className="space-y-4 border-t border-outline-variant/30 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
              data-reveal="section"
              style={revealDelay("220ms")}
            >
              <div className="eyebrow">Repère rapide</div>
              <p className="font-headline text-xl font-semibold text-on-surface">
                Si l&apos;énergie manque, gardez seulement deux chemins en tête.
              </p>
              <div className="space-y-3">
                <Link
                  href={"/messages" as Route}
                  className="motion-link-row home-quick-link flex items-center justify-between rounded-brand bg-surface-container-low px-4 py-4 font-label text-sm font-semibold text-on-surface hover:bg-surface-container"
                >
                  Lire mes messages
                  <ArrowRight
                    aria-hidden="true"
                    className="motion-link-arrow h-4 w-4 text-primary"
                    strokeWidth={2}
                  />
                </Link>
                <Link
                  href={"/parcours" as Route}
                  className="motion-link-row home-quick-link flex items-center justify-between rounded-brand bg-surface-container-low px-4 py-4 font-label text-sm font-semibold text-on-surface hover:bg-surface-container"
                >
                  Reprendre mon parcours
                  <ArrowRight
                    aria-hidden="true"
                    className="motion-link-arrow h-4 w-4 text-primary"
                    strokeWidth={2}
                  />
                </Link>
              </div>
              <p className="text-sm leading-7 text-on-surface-variant">
                Le reste peut attendre. Revenez ici quand vous voulez un autre point de départ.
              </p>
            </aside>
          </section>

          {featuredPartners.length > 0 ? (
            <section className="space-y-5" data-reveal="section" style={revealDelay("180ms")}>
              <div className="space-y-3">
                <div className="eyebrow">Professionnels partenaires</div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  Des fiches mises en avant pour rester faciles à retrouver.
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">
                  Ces professionnels disposent d&apos;une présence partenaire dans ROSE-SEIN:
                  leur fiche peut être mise en avant sur l&apos;accueil et leur activité est suivie
                  avec des indicateurs simples. Cette visibilité éditoriale n&apos;est pas un avis
                  médical personnalisé.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredPartners.map((professional) => (
                  <ProfessionalCard key={professional.id} profile={professional} />
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </HomeExperience>
    </AppShell>
  );
}
