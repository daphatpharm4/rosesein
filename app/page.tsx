import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CalendarHeart, HandHeart, HeartHandshake, MessageCircleHeart, Newspaper, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import {
  formatEventSchedule,
  formatPublishedDate,
  getPublicContentSnapshot,
} from "@/lib/content";
import { getCurrentUserContext } from "@/lib/auth";
import type { ProfileKind } from "@/lib/auth";
import { getActiveAssociationMessage } from "@/lib/association-message";

type Shortcut =
  | {
      title: string;
      description: string;
      href: Route;
      external: false;
      icon: typeof MessageCircleHeart;
      tone: string;
    }
  | {
      title: string;
      description: string;
      href: string;
      external: true;
      icon: typeof MessageCircleHeart;
      tone: string;
    };

function getShortcuts(profileKind: ProfileKind | undefined): Shortcut[] {
  const parcoursShortcut: Shortcut =
    profileKind === "caregiver"
      ? {
          title: "Accompagner au quotidien",
          description:
            "Organisez les rendez-vous, gardez des notes et suivez le parcours de la personne que vous soutenez.",
          href: "/parcours" as Route,
          external: false,
          icon: HandHeart,
          tone: "bg-primary/10 text-primary",
        }
      : {
          title: "Mon parcours",
          description:
            "Préparez rendez-vous, notes personnelles et suivi doux dans un seul espace.",
          href: "/parcours" as Route,
          external: false,
          icon: CalendarHeart,
          tone: "bg-primary/10 text-primary",
        };

  return [
    {
      title: "Messagerie apaisée",
      description:
        "Retrouvez les échanges avec l’association, vos groupes et vos contacts de confiance.",
      href: "/messages" as Route,
      external: false,
      icon: MessageCircleHeart,
      tone: "bg-primary/10 text-primary",
    },
    {
      title: "Actualités validées",
      description:
        "Centralisez les contenus vérifiés sur les traitements, le quotidien et les événements.",
      href: "/actualites" as Route,
      external: false,
      icon: Newspaper,
      tone: "bg-secondary-container text-on-secondary-container",
    },
    parcoursShortcut,
    {
      title: "Soutiens & ressources",
      description:
        "Accédez rapidement à la nutrition, au bien-être, aux groupes de parole et à l’aide.",
      href: "/association" as Route,
      external: false,
      icon: HeartHandshake,
      tone: "bg-secondary-container text-on-secondary-container",
    },
  ];
}

const WELLNESS_TIPS = [
  "Aujourd'hui, accordez-vous une pause sans écrans — même 10 minutes font la différence.",
  "Boire un grand verre d'eau le matin aide le corps à démarrer plus doucement.",
  "Un geste de douceur envers vous-même compte autant qu'un rendez-vous médical.",
  "La respiration lente active le système nerveux parasympathique. Essayez 4 secondes / 4 secondes.",
  "Dire non à quelque chose d'épuisant, c'est dire oui à votre énergie.",
  "Une courte promenade, même lente, change l'état d'esprit.",
  "Notez une chose qui s'est bien passée aujourd'hui, aussi petite soit-elle.",
  "Le repos n'est pas de la paresse — c'est une partie du soin.",
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
    new Date(value)
  );
}

export default async function HomePage() {
  const [{ configured, latestArticle, nextEvent }, { profile }, associationMessage] =
    await Promise.all([
      getPublicContentSnapshot(),
      getCurrentUserContext(),
      getActiveAssociationMessage(),
    ]);
  const todayTip = WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length];
  const shortcuts = getShortcuts(profile?.profileKind);
  const difficultDayMode = profile?.difficultDayMode ?? false;

  return (
    <AppShell currentPath="/">
      <section className="space-y-8">
        {/* Personalised greeting */}
        {profile && (
          <div className="surface-section flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-headline text-sm font-bold text-on-primary">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-headline text-2xl font-bold text-on-surface">
                Bonjour, {profile.pseudonym ?? profile.displayName} 🌸
              </p>
              <p className="mt-1 text-sm leading-7 text-on-surface-variant">{todayTip}</p>
            </div>
          </div>
        )}

        {difficultDayMode ? (
          <div className="surface-section space-y-4 border-l-4 border-secondary-container">
            <div>
              <div className="eyebrow">Aller a l'essentiel</div>
              <h2 className="font-headline text-2xl font-bold text-on-surface">
                Trois reperes simples pour aujourd&apos;hui.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href={"/aide" as Route}
                className="rounded-brand bg-surface-container-lowest px-4 py-4 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                Ouvrir l&apos;aide
              </Link>
              <Link
                href={"/messages" as Route}
                className="rounded-brand bg-surface-container-lowest px-4 py-4 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                Lire mes messages
              </Link>
              <Link
                href={"/parcours" as Route}
                className="rounded-brand bg-surface-container-lowest px-4 py-4 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                Voir mon parcours
              </Link>
            </div>
          </div>
        ) : null}

        {/* Association message */}
        {associationMessage && (
          <div className="surface-section space-y-2 border-l-4 border-primary/30">
            <div className="eyebrow">Message de l&apos;association</div>
            <p className="font-headline text-xl font-bold text-on-surface">
              {associationMessage.title}
            </p>
            <p className="text-base leading-7 text-on-surface-variant">{associationMessage.body}</p>
            <p className="font-label text-xs text-outline">
              Jusqu&apos;au {formatExpiryDate(associationMessage.expiresAt)}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="eyebrow">Le sanctuaire digital</div>
          <div className="surface-section overflow-hidden">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="space-y-4">
                <h1 className="editorial-title max-w-xl">
                  Un compagnon numérique calme, lisible et profondément humain.
                </h1>
                <p className="max-w-xl text-base leading-8 text-on-surface-variant">
                  ROSE-SEIN réunit information validée, soutien quotidien, communauté
                  bienveillante et organisation personnelle dans une expérience qui ne
                  ressemble pas à un outil médical classique.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/messages"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
                  >
                    Ouvrir la messagerie
                    <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                  </Link>
                  <Link
                    href="https://rosesein.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-on-surface shadow-ambient transition-transform hover:-translate-y-0.5"
                  >
                    Voir le site associatif
                  </Link>
                </div>
              </div>

              <div className="relative pt-3 lg:pt-10">
                <div className="surface-card lg:ml-8">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Dernier contenu publié
                  </p>
                  {latestArticle ? (
                    <>
                      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                        {latestArticle.category}
                      </p>
                      <p className="mt-2 font-headline text-lg font-semibold text-on-surface">
                        {latestArticle.title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                        {latestArticle.summary}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-outline">
                        Publié le {formatPublishedDate(latestArticle.publishedAt)}
                      </p>
                      <Link
                        href={`/actualites/${latestArticle.slug}`}
                        className="mt-4 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                      >
                        Lire l'article
                        <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                      </Link>
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                      {configured
                        ? "Aucun article publié n'est encore disponible dans l'application."
                        : "Configurez Supabase pour connecter les articles publiés à cette surface."}
                    </p>
                  )}
                </div>
                <div className="surface-card -mt-4 mr-10 bg-primary/10 shadow-none lg:-ml-6 lg:mr-0 lg:mt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-ambient">
                      <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-headline text-sm font-semibold text-on-surface">
                        Prochain événement
                      </p>
                      {nextEvent ? (
                        <>
                          <p className="mt-1 truncate text-sm font-semibold text-on-surface">
                            {nextEvent.title}
                          </p>
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {formatEventSchedule(nextEvent)}
                          </p>
                          {nextEvent.locationLabel ? (
                            <p className="text-xs uppercase tracking-[0.16em] text-outline">
                              {nextEvent.locationLabel}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {configured
                            ? "Aucun événement publié à venir pour le moment."
                            : "Les événements publiés apparaîtront ici une fois Supabase configuré."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="surface-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="eyebrow">Repère rapide</div>
              <h2 className="font-headline text-2xl font-bold text-on-surface">
                Besoin d&apos;aide, d&apos;orientation, ou d&apos;un contact utile ?
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                Une surface dédiée rappelle quoi faire selon la situation, vers quel
                canal se tourner, et quand sortir de l&apos;application pour contacter les
                secours.
              </p>
            </div>
            <Link
              href="/aide"
              className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-primary shadow-ambient transition-transform hover:-translate-y-0.5"
            >
              Ouvrir l&apos;aide
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </section>

        <section id="ressources" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Accès rapides</div>
              <h2 className="font-headline text-2xl font-bold text-on-surface">
                Les premiers espaces à ouvrir
              </h2>
            </div>
            <p className="max-w-xs text-right text-sm text-on-surface-variant">
              Des parcours simples, une hiérarchie éditoriale claire et aucune interface
              agressive.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {shortcuts.map(({ title, description, href, external, icon: Icon, tone }) => {
              const content = (
                <>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-headline text-xl font-semibold text-on-surface">
                      {title}
                    </h3>
                    <p className="text-sm leading-7 text-on-surface-variant">
                      {description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
                    Explorer
                    <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                  </span>
                </>
              );

              if (external) {
                return (
                  <a
                    key={title}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="surface-card group flex min-h-48 flex-col justify-between"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={title}
                  href={href}
                  className="surface-card group flex min-h-48 flex-col justify-between"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </section>

        <section id="parcours" className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-section">
            <div className="eyebrow">Architecture produit</div>
            <h2 className="mt-3 font-headline text-2xl font-bold text-on-surface">
              Une base prête pour Accueil, Soins, Communauté, Chat et Parcours.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant">
              Cette première itération pose le socle visuel et technique du projet:
              Next.js App Router, Tailwind local, thèmes éditoriaux, navigation mobile
              cohérente et structure compatible avec Supabase pour l’authentification,
              les profils, la messagerie et les contenus validés.
            </p>
          </div>

          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Ce qui vient ensuite
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
              <li>Paramètres et préférences reliés à Supabase.</li>
              <li>Messagerie réelle avec fils de discussion protégés.</li>
              <li>Agenda personnel, documents sécurisés et notifications.</li>
              <li>Processus éditorial public et application documenté pour l'association.</li>
            </ul>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
