import Link from "next/link";
import { BriefcaseMedical, CalendarRange, Megaphone, Send, ShieldAlert, UserRoundCog } from "lucide-react";
import type { Route } from "next";

import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { requireStaff } from "@/lib/auth";

export default async function AdminPage() {
  await requireStaff("/admin");

  return (
    <AppShell title="Administration" currentPath="/admin">
      <section className="space-y-6">
        <BackLink href="/" label="Retour à l'accueil" />

        <div className="space-y-2">
          <div className="eyebrow">Espace équipe</div>
          <h1 className="editorial-title">Administration</h1>
          <p className="text-base leading-7 text-on-surface-variant">
            Outils de gestion réservés aux membres de l&apos;équipe ROSE-SEIN.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={"/admin/moderation" as Route}
            className="surface-card group flex items-start gap-4 hover:border-primary/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldAlert aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                Modération
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Signalements, avertissements et actions de modération.
              </p>
            </div>
          </Link>

          <Link
            href={"/admin/message-association" as Route}
            className="surface-card group flex items-start gap-4 hover:border-primary/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Megaphone aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                Message de l&apos;association
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Publiez un message visible sur la page d&apos;accueil.
              </p>
            </div>
          </Link>

          <Link
            href={"/admin/utilisateurs" as Route}
            className="surface-card group flex items-start gap-4 hover:border-primary/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <UserRoundCog aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                Utilisateurs
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Rôles staff, profils pseudonymes et gestion des accès.
              </p>
            </div>
          </Link>

          <Link
            href={"/admin/messagerie" as Route}
            className="surface-card group flex items-start gap-4 hover:border-primary/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Send aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                Messagerie collective
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Diffusions ciblées et groupes de conversation.
              </p>
            </div>
          </Link>

          <Link
            href={"/admin/evenements" as Route}
            className="surface-card group flex items-start gap-4 hover:border-primary/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <CalendarRange aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                Événements
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Créer, publier et suivre les inscriptions aux rendez-vous.
              </p>
            </div>
          </Link>

          <Link
            href={"/admin/professionnels" as Route}
            className="surface-card group flex items-start gap-4 hover:border-primary/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BriefcaseMedical aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface group-hover:text-primary">
                Professionnels
              </p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Offres, activation des fiches et pilotage de l'espace professionnel.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
