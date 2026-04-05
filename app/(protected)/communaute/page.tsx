import { AppShell } from "@/components/shell/app-shell";
import { CommunitySpaceCard } from "@/components/community/community-space-card";
import { getCommunitySpaces } from "@/lib/communaute";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const spaces = await getCommunitySpaces();

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Espaces bienveillants</div>
          <h1 className="editorial-title">Vous n&apos;êtes pas seul·e.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Des espaces animés par l&apos;association, ouverts aux échanges,
            aux questions et au soutien mutuel. Chaque fil est créé et modéré
            par l&apos;équipe ROSE-SEIN.
          </p>
        </div>

        {spaces.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {spaces.map((space) => (
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
