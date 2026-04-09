import { redirect } from "next/navigation";

import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { requireCompletedProfile } from "@/lib/auth";
import { CommunitySpaceCard } from "@/components/community/community-space-card";
import { getCommunitySpaces, isCommunitySpaceAccessible } from "@/lib/communaute";

export const dynamic = "force-dynamic";

type CommunityPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "space-not-allowed": "Votre profil actuel ne peut pas ouvrir cet espace.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const { profile, roles } = await requireCompletedProfile("/communaute");
  if (!profile) redirect("/account?status=complete-profile");
  const query = (await searchParams) ?? {};
  const error = firstValue(query.error);
  const spaces = await getCommunitySpaces();
  const visibleSpaces = spaces.filter((space) =>
    isCommunitySpaceAccessible(space.allowedKind, profile.profileKind, roles),
  );

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <BackLink href="/" label="Retour à l'accueil" />

        <div className="space-y-3">
          <div className="eyebrow">Espaces bienveillants</div>
          <h1 className="editorial-title">Vous n&apos;êtes pas seul·e.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Des espaces animés par l&apos;association, ouverts aux échanges,
            aux questions et au soutien mutuel. Chaque fil est créé et modéré
            par l&apos;équipe ROSE-SEIN.
          </p>
        </div>

        {error && feedbackMap[error] ? (
          <div
            className="surface-card bg-primary/10 text-on-primary-container"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-headline text-base font-semibold">Communauté</p>
            <p className="mt-2 text-sm leading-7">{feedbackMap[error]}</p>
          </div>
        ) : null}

        {visibleSpaces.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleSpaces.map((space) => (
              <CommunitySpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Les espaces arrivent bientôt
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              L&apos;équipe prépare les premiers espaces de discussion.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
