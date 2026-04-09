import Link from "next/link";
import { Globe, Link2, ShieldCheck } from "lucide-react";
import type { Route } from "next";

import { BackLink } from "@/components/navigation/back-link";
import { BioTextarea } from "@/components/pro/bio-textarea";
import { CopyUrlButton } from "@/components/pro/copy-url-button";
import { ProfessionalTaxonomyFields } from "@/components/pro/professional-taxonomy-fields";
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
  "category-required": "Choisissez une seule famille d'exercice, puis la catégorie correspondante.",
  "category-exclusive":
    "Une fiche professionnelle ne peut relever que d'une seule famille d'exercice: catégorie médicale ou soins de support.",
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rosesein.vercel.app";
  const fullPublicUrl = `${siteUrl}${publicHref}`;
  const medicalOptions = Object.entries(MEDICAL_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const supportOptions = Object.entries(SUPPORT_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <AppShell title="Espace pro" currentPath="/pro">
      <section className="space-y-6">
        <BackLink href="/pro" label="Retour à l'espace pro" />

        <div className="surface-section space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="eyebrow">Fiche publique</div>
              {/* H1: replaced editorial-title (marketing size) with a practical heading */}
              <h1 className="font-headline text-2xl font-bold leading-tight text-on-surface sm:text-3xl">
                Gérez votre fiche annuaire
              </h1>
              <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
                Cette page alimente votre présence dans l&apos;annuaire. Elle doit aider une
                patiente à comprendre rapidement qui vous êtes, comment vous consultez et
                comment demander un rendez-vous, sans ambiguïté sur votre cadre d&apos;intervention.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubscriptionBadge tier={profile.subscriptionTier} />
              {/* H4: min-h-[44px] ensures touch target */}
              <Link
                href={publicHref as Route}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-3 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                <Globe aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Voir ma fiche
              </Link>
            </div>
          </div>

          {/* H2: full URL (with domain) + copy button */}
          <div className="rounded-brand bg-surface-container-lowest px-4 py-4 text-sm leading-7 text-on-surface-variant shadow-ambient">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-primary">
                <Link2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em]">
                  URL publique
                </span>
              </div>
              <CopyUrlButton url={fullPublicUrl} />
            </div>
            <p className="mt-2 break-all text-on-surface">
              {fullPublicUrl}
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
                {/* H5: required asterisk; C1: label readable at small size */}
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Nom d&apos;usage public
                  <span aria-hidden="true" className="ml-1 text-primary">*</span>
                </span>
                {/* L1: motion-field micro-interaction; M3: autocomplete */}
                <input
                  type="text"
                  name="displayName"
                  defaultValue={profile.displayName}
                  autoComplete="name"
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface motion-field"
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
                  autoComplete="organization-title"
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface motion-field"
                />
              </label>
            </div>

            <ProfessionalTaxonomyFields
              defaultKind={profile.professionalKind}
              defaultMedicalCategory={profile.medicalCategory}
              defaultSupportCategory={profile.supportCategory}
              medicalOptions={medicalOptions}
              supportOptions={supportOptions}
            />

            {/* M5: BioTextarea with maxLength + live counter */}
            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Présentation
              </span>
              <BioTextarea defaultValue={profile.bio} />
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
                  autoComplete="address-level2"
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface motion-field"
                />
              </label>

              {/* M2: datalist for country; removed misleading uppercase CSS transform */}
              <div className="block space-y-2">
                <label htmlFor="country-input" className="block font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Pays
                </label>
                <input
                  id="country-input"
                  type="text"
                  name="country"
                  defaultValue={profile.country}
                  list="country-list"
                  autoComplete="country-name"
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface motion-field"
                />
                <datalist id="country-list">
                  <option value="France" />
                  <option value="Belgique" />
                  <option value="Suisse" />
                  <option value="Luxembourg" />
                  <option value="Canada" />
                  <option value="Maroc" />
                  <option value="Tunisie" />
                  <option value="Algérie" />
                </datalist>
              </div>
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
              {/* H3: currency + unit suffix */}
              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Tarif indicatif
                </span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    name="consultationPriceEur"
                    min="0"
                    defaultValue={profile.consultationPriceEur ?? ""}
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 pr-24 text-sm text-on-surface motion-field"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 text-sm text-on-surface-variant"
                  >
                    € / séance
                  </span>
                </div>
              </label>

              {/* M3: autocomplete="tel" */}
              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Téléphone
                </span>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={profile.phone ?? ""}
                  autoComplete="tel"
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface motion-field"
                />
              </label>
            </div>

            {/* M3: autocomplete="url" */}
            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Site web
              </span>
              <input
                type="url"
                name="website"
                defaultValue={profile.website ?? ""}
                autoComplete="url"
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface motion-field"
              />
            </label>

            {/* L3: simplified label — scannable at a glance */}
            <label className="flex items-start gap-3 rounded-brand bg-secondary-container/40 px-4 py-4">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={profile.isActive}
                className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/20"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-semibold text-on-surface">
                  Fiche visible dans l&apos;annuaire
                </span>
                <span className="block text-xs leading-5 text-on-surface-variant">
                  Autorise la consultation de vos créneaux publics par les patientes.
                </span>
              </span>
            </label>

            {/* L4: motion-cta for hover/active feedback */}
            <button
              type="submit"
              className="motion-cta inline-flex w-full items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
            >
              Enregistrer la fiche
            </button>
          </form>

          {/* L2: actionable tip replacing redundant copy */}
          <aside className="space-y-4">
            <div className="surface-card space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
                <p className="font-headline text-base font-semibold text-on-surface">Bon à savoir</p>
              </div>
              <p className="text-sm leading-7 text-on-surface-variant">
                Les fiches avec une présentation, un tarif et au moins un mode de consultation
                renseignés reçoivent significativement plus de demandes de rendez-vous.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
