import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  CalendarRange,
  Gift,
  HandHeart,
  HeartHandshake,
  Landmark,
  Newspaper,
  Users,
  UsersRound,
} from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import {
  formatEventSchedule,
  formatPublishedDate,
  getPublicContentSnapshot,
} from "@/lib/content";

const associationAreas = [
  {
    title: "Mission et valeurs",
    description:
      "Préserver une parole rassurante, utile et profondément humaine pour les patientes et les aidants.",
    icon: Landmark,
  },
  {
    title: "Bénévolat et entraide",
    description:
      "Préparer les futurs parcours bénévoles, groupes de parole et espaces d'accompagnement.",
    icon: UsersRound,
  },
  {
    title: "Partenaires et soutien",
    description:
      "Relier la visibilité publique de l'association aux futurs appels à l'engagement dans l'application.",
    icon: HandHeart,
  },
];

const engagementOptions = [
  {
    title: "Adhérer",
    description:
      "Rejoignez l'association et laissez l'équipe vous recontacter dans l'application.",
    href: "/association/engagement?kind=membership" as Route,
    cta: "Envoyer une demande",
    icon: HeartHandshake,
    tone: "primary" as const,
  },
  {
    title: "Faire un don",
    description: "Soutenez les programmes d'accompagnement et les ateliers.",
    href: "/association/engagement?kind=donation" as Route,
    cta: "Signaler mon soutien",
    icon: Gift,
    tone: "secondary" as const,
  },
  {
    title: "Devenir bénévole",
    description:
      "Offrez votre temps et vos compétences pour accompagner les patientes.",
    href: "/association/engagement?kind=volunteer" as Route,
    cta: "Proposer mon aide",
    icon: Users,
    tone: "primary" as const,
  },
];

export const revalidate = 300;

export default async function AssociationPage() {
  const { configured, latestArticle, events } = await getPublicContentSnapshot();
  const upcomingEvents = events.slice(0, 3);

  return (
    <AppShell title="Association" currentPath="/association">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Présence institutionnelle</div>
          <h1 className="editorial-title">
            Une application en continuité avec la voix de ROSE-SEIN.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            La mission associative reste éditorialement cohérente entre le site public
            et l'application. Les surfaces ci-dessous lisent les publications déjà
            rendues publiques dans Supabase.
          </p>
        </div>

        <section className="grid gap-6 border-y border-outline-variant/25 py-8 lg:grid-cols-3">
          {associationAreas.map(({ title, description, icon: Icon }, index) => (
            <div
              key={title}
              className={`${index === 0 ? "" : "lg:border-l lg:border-outline-variant/20 lg:pl-6"} space-y-3`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h2 className="font-headline text-lg font-semibold text-on-surface">{title}</h2>
              <p className="text-sm leading-7 text-on-surface-variant">{description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-start">
          <div className="space-y-4">
            <div className="eyebrow">Repère institutionnel</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Une gouvernance éditoriale lisible, sans bruit supplémentaire.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
              Le site public porte la mission institutionnelle, les dons et les appels à
              engagement. L'application reprend uniquement les contenus et événements déjà
              publiés dans le flux éditorial validé.
            </p>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              Cette continuité évite d'exposer des informations divergentes entre les
              surfaces publiques et l'espace privé.
            </p>
            <Link
              href="https://rosesein.org/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-5 py-3 font-label text-sm font-semibold text-primary transition-colors hover:bg-surface-container"
            >
              Voir le site actuel
            </Link>
          </div>

          <aside className="surface-card space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Newspaper aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="font-headline text-lg font-semibold text-on-surface">
              Repère éditorial récent
            </p>
            {latestArticle ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  {latestArticle.category}
                </p>
                <p className="font-headline text-lg font-semibold text-on-surface">
                  {latestArticle.title}
                </p>
                <p className="text-sm leading-7 text-on-surface-variant">
                  {latestArticle.summary}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-outline">
                  Publié le {formatPublishedDate(latestArticle.publishedAt)}
                </p>
                <Link
                  href={`/actualites/${latestArticle.slug}`}
                  className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                >
                  Lire l'article
                  <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </>
            ) : (
              <p className="text-sm leading-7 text-on-surface-variant">
                {configured
                  ? "Aucun article publié n'est encore visible sur cette surface."
                  : "Connectez Supabase pour alimenter cette section avec du contenu publié."}
              </p>
            )}
          </aside>
        </section>

        <section className="space-y-4">
          <div>
            <div className="eyebrow">Agenda associatif</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Les prochains rendez-vous publiés
            </h2>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="divide-y divide-outline-variant/25 border-y border-outline-variant/30">
              {upcomingEvents.map((event) => (
                <article
                  key={event.id}
                  className="grid gap-4 py-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-start"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                    <CalendarRange aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-headline text-lg font-semibold text-on-surface">
                      {event.title}
                    </h3>
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
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-card">
              <p className="font-headline text-lg font-semibold text-on-surface">
                Aucun événement associatif publié à venir
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                {configured
                  ? "Publiez un événement dans Supabase pour l'afficher ici."
                  : "Cette section se reliera aux événements publiés dès que Supabase sera actif."}
              </p>
            </div>
          )}
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="space-y-3">
            <div className="eyebrow">Rejoindre la communauté</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              S&apos;engager avec ROSE-SEIN
            </h2>
            <p className="max-w-lg text-base leading-8 text-on-surface-variant">
              Chaque forme d&apos;engagement ouvre ensuite un échange humain. L&apos;objectif
              n&apos;est pas de multiplier les démarches, mais de rendre la première prise
              de contact claire.
            </p>
          </div>

          <div className="divide-y divide-outline-variant/25 border-y border-outline-variant/30">
            {engagementOptions.map(({ title, description, href, cta, icon: Icon, tone }) => (
              <Link
                key={title}
                href={href}
                className="group grid gap-4 py-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    tone === "secondary"
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-semibold text-on-surface">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    {description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
                  {cta}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
