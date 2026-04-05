import Link from "next/link";
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

        <div className="grid gap-4 lg:grid-cols-3">
          {associationAreas.map(({ title, description, icon: Icon }) => (
            <div key={title} className="surface-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h2 className="mt-5 font-headline text-lg font-semibold text-on-surface">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                {description}
              </p>
            </div>
          ))}
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-section">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <HeartHandshake aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="space-y-2">
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Gouvernance éditoriale
                </p>
                <p className="text-sm leading-7 text-on-surface-variant">
                  Le site public porte la mission institutionnelle, les dons et les
                  appels à engagement. L'application reprend uniquement les contenus et
                  événements déjà publiés dans le flux éditorial validé.
                </p>
                <Link
                  href="https://rosesein.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-primary shadow-ambient"
                >
                  Voir le site actuel
                </Link>
              </div>
            </div>
          </div>

          <div className="surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Newspaper aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="mt-5 font-headline text-lg font-semibold text-on-surface">
              Repère éditorial récent
            </p>
            {latestArticle ? (
              <>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
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
                  <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                {configured
                  ? "Aucun article publié n'est encore visible sur cette surface."
                  : "Connectez Supabase pour alimenter cette section avec du contenu publié."}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <div className="eyebrow">Agenda associatif</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Les prochains rendez-vous publiés
            </h2>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {upcomingEvents.map((event) => (
                <article key={event.id} className="surface-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                    <CalendarRange aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 font-headline text-lg font-semibold text-on-surface">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    {event.description}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-on-surface">
                    {formatEventSchedule(event)}
                  </p>
                  {event.locationLabel ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-outline">
                      {event.locationLabel}
                    </p>
                  ) : null}
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

        <section className="space-y-4">
          <div>
            <div className="eyebrow">Rejoindre la communauté</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              S&apos;engager avec ROSE-SEIN
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <a
              href="https://rosesein.org/"
              target="_blank"
              rel="noreferrer"
              className="surface-card space-y-4 block"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HeartHandshake aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-on-surface">Adhérer</h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Rejoignez l&apos;association et participez à ses actions.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
                Adhérer sur rosesein.org
                <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </a>

            <a
              href="https://rosesein.org/"
              target="_blank"
              rel="noreferrer"
              className="surface-card space-y-4 block"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <Gift aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-on-surface">Faire un don</h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Soutenez les programmes d&apos;accompagnement et les ateliers.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
                Faire un don
                <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </a>

            <a
              href="https://rosesein.org/"
              target="_blank"
              rel="noreferrer"
              className="surface-card space-y-4 block"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-on-surface">Devenir bénévole</h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Offrez votre temps et vos compétences pour accompagner les patientes.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
                S&apos;inscrire
                <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </a>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
