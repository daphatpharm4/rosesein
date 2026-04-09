import { notFound, redirect } from "next/navigation";
import { PenSquare, ShieldCheck } from "lucide-react";
import type { Route } from "next";

import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { requireCompletedProfile } from "@/lib/auth";
import { getSpaceWithThreads, isCommunitySpaceAccessible } from "@/lib/communaute";

import { createCommunityThread } from "../../actions";

type NewCommunityThreadPageProps = {
  params: Promise<{ spaceSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "thread-invalid": "Ajoutez un titre clair et quelques lignes de contexte.",
  "thread-create-failed": "Le sujet n'a pas pu être publié.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewCommunityThreadPage({
  params,
  searchParams,
}: NewCommunityThreadPageProps) {
  const { spaceSlug } = await params;
  const result = await getSpaceWithThreads(spaceSlug);
  const query = (await searchParams) ?? {};
  const error = firstValue(query.error);

  if (!result) {
    notFound();
  }

  const { profile, roles } = await requireCompletedProfile(`/communaute/${spaceSlug}/nouveau`);
  if (!profile) redirect("/account?status=complete-profile");

  if (!isCommunitySpaceAccessible(result.space.allowedKind, profile.profileKind, roles)) {
    redirect("/communaute?error=space-not-allowed");
  }

  return (
    <AppShell title="Communauté" currentPath="/communaute">
      <section className="space-y-6">
        <BackLink
          href={`/communaute/${spaceSlug}` as Route}
          label={`Retour à ${result.space.title}`}
        />

        <div className="space-y-3">
          <div className="eyebrow">Nouveau sujet</div>
          <h1 className="editorial-title">Ouvrir un échange dans {result.space.title}</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Posez une question, partagez un vécu, ou lancez une discussion utile. Le
            ton reste simple, calme et bienveillant.
          </p>
        </div>

        {error && feedbackMap[error] ? (
          <div
            className="surface-card bg-primary/10 text-on-primary-container"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-headline text-base font-semibold">Publication du sujet</p>
            <p className="mt-2 text-sm leading-7">{feedbackMap[error]}</p>
          </div>
        ) : null}

        <section className="surface-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-base font-semibold text-on-surface">
                Charte de bienveillance
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                On parle depuis son vécu, on évite les injonctions, on ne remplace pas
                un avis médical et on protège les informations sensibles d&apos;autrui.
              </p>
            </div>
          </div>
        </section>

        <form action={createCommunityThread} className="surface-section space-y-5">
          <input type="hidden" name="spaceSlug" value={spaceSlug} />

          <label className="block space-y-2">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Titre
            </span>
            <input
              type="text"
              name="title"
              required
              minLength={4}
              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
              placeholder="Exemple: Comment gérez-vous les jours de très grande fatigue ?"
            />
          </label>

          <label className="block space-y-2">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Message
            </span>
            <textarea
              name="body"
              rows={6}
              required
              minLength={8}
              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
              placeholder="Expliquez ce que vous vivez, ce que vous cherchez, ou le type de réponses qui vous aideraient."
            />
          </label>

          <label className="flex items-start gap-3 rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
            <input
              type="checkbox"
              name="isAnonymous"
              className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
            />
            <span className="text-sm leading-7 text-on-surface-variant">
              Publier ce sujet sous forme pseudonyme dans l&apos;espace public, tout en
              restant identifiable par l&apos;association si une modération est nécessaire.
            </span>
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
          >
            <PenSquare aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            Publier le sujet
          </button>
        </form>
      </section>
    </AppShell>
  );
}
