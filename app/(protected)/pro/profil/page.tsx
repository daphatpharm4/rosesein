import Link from "next/link";
import { Globe, Link2, ShieldCheck } from "lucide-react";
import type { Route } from "next";

import { BackLink } from "@/components/navigation/back-link";
import { SubscriptionBadge } from "@/components/pro/subscription-badge";
import { AppShell } from "@/components/shell/app-shell";
import { requireProfessional } from "@/lib/auth";
import {
  MEDICAL_CATEGORY_LABELS,
  SUPPORT_CATEGORY_LABELS,
  getProfessionalProfileByUserId,
} from "@/lib/professional";

import { saveProfessionalProfile } from "./actions";

export const dynamic = "force-dynamic";

type ProProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "profile-saved": "Votre fiche publique a été mise à jour.",
  "profile-invalid": "Complétez les informations essentielles de la fiche.",
  "category-required": "Choisissez une catégorie cohérente avec le parcours sélectionné.",
  "price-invalid": "Le tarif doit être un nombre valide.",
  "profile-save-failed": "La mise à jour de la fiche a échoué pour le moment.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProProfilePage({ searchParams }: ProProfilePageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const { user } = await requireProfessional("/pro/profil");
  const profile = await getProfessionalProfileByUserId(user.id);

  if (!profile) {
    return null;
  }

  const feedbackKey = error ?? status;
  const feedback = feedbackKey ? feedbackMap[feedbackKey] : null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const publicHref = `/professionnels/${profile.slug}`;

  return (
    <AppShell title="Espace pro" currentPath="/pro">
      <section className="space-y-6">
        <BackLink href="/pro" label="Retour à l'espace pro" />

        <div className="surface-section space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="eyebrow">Fiche publique</div>
              <h1 className="editorial-title">Soigner la première impression avec une fiche nette et rassurante.</h1>
              <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
                Cette page alimente votre présence dans l&apos;annuaire. Elle doit aider une
                patiente à comprendre rapidement qui vous êtes, comment vous consultez et
                comment demander un rendez-vous.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubscriptionBadge tier={profile.subscriptionTier} />
              <Link
                href={publicHref as Route}
                className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                <Globe aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Voir ma fiche
              </Link>
            </div>
          </div>

          <div className="rounded-brand bg-surface-container-lowest px-4 py-4 text-sm leading-7 text-on-surface-variant shadow-ambient">
            <div className="flex items-center gap-2 text-primary">
              <Link2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em]">
                URL publique
              </span>
            </div>
            <p className="mt-2 break-all text-on-surface">
              {publicHref}
            </p>
          </div>
        </div>

        {feedback ? (
          <div className={`surface-card ${feedbackTone}`} role={error ? "alert" : "status"}>
            <p className="font-headline text-base font-semibold">Fiche publique</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <form action={saveProfessionalProfile} className="surface-section space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Nom d&apos;usage public
                </span>
                <input
                  type="text"
                  name="displayName"
                  defaultValue={profile.displayName}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Titre
                </span>
                <input
                  type="text"
                  name="title"
                  defaultValue={profile.title ?? ""}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                />
              </label>

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Parcours
                </span>
                <select
                  name="professionalKind"
                  defaultValue={profile.professionalKind}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                >
                  <option value="medical">Parcours médical</option>
                  <option value="support_care">Soins de support</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Catégorie médicale
                </span>
                <select
                  name="medicalCategory"
                  defaultValue={profile.medicalCategory ?? ""}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                >
                  <option value="">Sélectionner si parcours médical</option>
                  {Object.entries(MEDICAL_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Soins de support
                </span>
                <select
                  name="supportCategory"
                  defaultValue={profile.supportCategory ?? ""}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                >
                  <option value="">Sélectionner si soins de support</option>
                  {Object.entries(SUPPORT_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Présentation
              </span>
              <textarea
                name="bio"
                rows={5}
                defaultValue={profile.bio ?? ""}
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm leading-7 text-on-surface"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Ville
                </span>
                <input
                  type="text"
                  name="city"
                  defaultValue={profile.city ?? ""}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                />
              </label>

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Pays
                </span>
                <input
                  type="text"
                  name="country"
                  defaultValue={profile.country}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm uppercase text-on-surface"
                />
              </label>
            </div>

            <fieldset className="space-y-3">
              <legend className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Modes de consultation
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: "presentiel", label: "Présentiel" },
                  { value: "telephone", label: "Téléphone" },
                  { value: "visio", label: "Visio" },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 rounded-brand bg-surface-container-lowest px-4 py-4 text-sm text-on-surface shadow-ambient"
                  >
                    <input
                      type="checkbox"
                      name="consultationModes"
                      value={value}
                      defaultChecked={profile.consultationModes.includes(value as typeof profile.consultationModes[number])}
                      className="h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/20"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Tarif indicatif
                </span>
                <input
                  type="number"
                  name="consultationPriceEur"
                  min="0"
                  defaultValue={profile.consultationPriceEur ?? ""}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                />
              </label>

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Téléphone
                </span>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={profile.phone ?? ""}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Site web
              </span>
              <input
                type="url"
                name="website"
                defaultValue={profile.website ?? ""}
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
              />
            </label>

            <label className="flex items-start gap-3 rounded-brand bg-secondary-container/40 px-4 py-4">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={profile.isActive}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/20"
              />
              <span className="text-sm leading-7 text-on-surface-variant">
                Garder ma fiche visible dans l&apos;annuaire et autoriser la consultation de mes créneaux publics.
              </span>
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
            >
              Enregistrer la fiche
            </button>
          </form>

          <aside className="space-y-4">
            <div className="surface-card space-y-3">
              <div className="flex items-center gap-3 text-primary">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                <p className="font-headline text-base font-semibold text-on-surface">Bon repère éditorial</p>
              </div>
              <p className="text-sm leading-7 text-on-surface-variant">
                Une fiche professionnelle rassure davantage quand elle reste concise, claire
                et concrète: qui vous êtes, pour quoi vous consulter, et comment se passe le premier échange.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
