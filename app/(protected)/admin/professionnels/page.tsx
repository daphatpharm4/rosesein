import { BriefcaseMedical, ShieldCheck } from "lucide-react";

import { BackLink } from "@/components/navigation/back-link";
import { SubscriptionBadge } from "@/components/pro/subscription-badge";
import { AppShell } from "@/components/shell/app-shell";
import { requireAdmin } from "@/lib/auth";
import { SUBSCRIPTION_TIER_DEFINITIONS, getManagedProfessionals } from "@/lib/professional";

import { toggleProfessionalActive, updateSubscriptionTier } from "./actions";

export const dynamic = "force-dynamic";

type AdminProfessionalsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "tier-updated": "L'offre du professionnel a été mise à jour.",
  "professional-updated": "Le statut du professionnel a été mis à jour.",
  "tier-invalid": "Choisissez une offre valide.",
  "tier-save-failed": "La mise à jour de l'offre a échoué.",
  "toggle-invalid": "Le professionnel ciblé est introuvable.",
  "toggle-failed": "Le changement de statut a échoué.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProfessionalsPage({
  searchParams,
}: AdminProfessionalsPageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const feedbackKey = error ?? status;
  const feedback = feedbackKey ? feedbackMap[feedbackKey] : null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  await requireAdmin("/admin/professionnels");
  const professionals = await getManagedProfessionals();

  return (
    <AppShell title="Administration" currentPath="/admin">
      <section className="space-y-6">
        <BackLink href="/admin" label="Retour à l'administration" />

        <div className="space-y-3">
          <div className="eyebrow">Professionnels</div>
          <h1 className="editorial-title">Suivre les fiches, les offres et la visibilité.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Cette surface aide l&apos;équipe à piloter l&apos;espace professionnel: offre active,
            visibilité dans l&apos;annuaire et état de publication de chaque fiche.
          </p>
        </div>

        {feedback ? (
          <div className={`surface-card ${feedbackTone}`} role={error ? "alert" : "status"}>
            <p className="font-headline text-base font-semibold">Administration des professionnels</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="surface-card">
            <p className="text-xs uppercase tracking-[0.16em] text-outline">Professionnels inscrits</p>
            <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{professionals.length}</p>
          </div>
          <div className="surface-card">
            <p className="text-xs uppercase tracking-[0.16em] text-outline">Fiches actives</p>
            <p className="mt-2 font-headline text-3xl font-bold text-on-surface">
              {professionals.filter((professional) => professional.isActive).length}
            </p>
          </div>
          <div className="surface-card">
            <p className="text-xs uppercase tracking-[0.16em] text-outline">Offres partenaires</p>
            <p className="mt-2 font-headline text-3xl font-bold text-on-surface">
              {professionals.filter((professional) => professional.subscriptionTier === "partenaire").length}
            </p>
          </div>
        </div>

        {professionals.length > 0 ? (
          <div className="space-y-4">
            {professionals.map((professional) => (
              <article key={professional.id} className="surface-section space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BriefcaseMedical aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-headline text-lg font-semibold text-on-surface">
                        {professional.structureName ?? professional.displayName}
                      </p>
                      <p className="text-sm leading-7 text-on-surface-variant">
                        {professional.categoryLabel}
                        {professional.city ? ` · ${professional.city}, ${professional.country}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <SubscriptionBadge tier={professional.subscriptionTier} />
                    <span
                      className={`rounded-full px-3 py-1 font-label text-xs font-semibold ${
                        professional.isActive
                          ? "bg-secondary-container/70 text-on-secondary-container"
                          : "bg-primary/10 text-on-primary-container"
                      }`}
                    >
                      {professional.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_10rem]">
                  <form action={updateSubscriptionTier} className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
                    <input type="hidden" name="professionalId" value={professional.id} />
                    <label className="block space-y-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Offre active
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          name="subscriptionTier"
                          defaultValue={professional.subscriptionTier}
                          className="min-w-0 flex-1 rounded-brand bg-surface-container-high px-4 py-3 text-sm text-on-surface"
                        >
                          <option value="solidaire">Solidaire</option>
                          <option value="visibilite_agenda">Visibilité + agenda</option>
                          <option value="partenaire">Partenaire</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-full bg-gradient-primary px-4 py-2.5 font-label text-sm font-semibold text-on-primary"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </label>
                  </form>

                  <form action={toggleProfessionalActive} className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
                    <input type="hidden" name="professionalId" value={professional.id} />
                    <input type="hidden" name="isActive" value={String(!professional.isActive)} />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-surface-container-low px-4 py-3 font-label text-sm font-semibold text-on-surface"
                    >
                      {professional.isActive ? "Désactiver" : "Réactiver"}
                    </button>
                  </form>

                  <div className="rounded-brand bg-secondary-container/40 px-4 py-4 text-sm leading-7 text-on-surface-variant">
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em]">
                        Repère d&apos;offre
                      </span>
                    </div>
                    <p className="mt-2">
                      {SUBSCRIPTION_TIER_DEFINITIONS[professional.subscriptionTier].summary}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Aucun professionnel inscrit
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Les nouvelles inscriptions apparaîtront ici dès qu&apos;une fiche professionnelle sera créée.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
