import { redirect } from "next/navigation";

import { ProfessionalTaxonomyFields } from "@/components/pro/professional-taxonomy-fields";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext, requireUser } from "@/lib/auth";
import { normalizeInternalPath } from "@/lib/internal-path";
import {
  MEDICAL_CATEGORY_LABELS,
  SUBSCRIPTION_TIER_DEFINITIONS,
  SUPPORT_CATEGORY_LABELS,
  getProfessionalProfileByUserId,
} from "@/lib/professional";

import { createProfessionalAccount } from "./actions";

export const dynamic = "force-dynamic";

type ProOnboardingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const messageMap: Record<string, string> = {
  "missing-fields": "Complétez au minimum votre nom d'usage et votre parcours professionnel.",
  "category-required": "Choisissez une seule famille d'exercice, puis la catégorie correspondante.",
  "category-exclusive":
    "Une fiche professionnelle ne peut relever que d'une seule famille d'exercice: catégorie médicale ou soins de support.",
  "price-invalid": "Le tarif de consultation doit être un nombre valide.",
  "profile-save-failed":
    "Le compte professionnel n'a pas pu être préparé. Vérifiez la configuration Supabase.",
  "pro-profile-save-failed":
    "La fiche professionnelle n'a pas pu être enregistrée. Réessayez dans un instant.",
  "complete-pro-profile":
    "Terminez votre fiche pour activer l'annuaire, l'agenda et votre tableau de bord professionnel.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProOnboardingPage({ searchParams }: ProOnboardingPageProps) {
  const params = (await searchParams) ?? {};
  const { user, profile } = await getCurrentUserContext();

  if (!user) {
    await requireUser();
  }

  if (profile && profile.profileKind !== "professional") {
    redirect("/account?error=professional-space-forbidden");
  }

  const existingProfessionalProfile = user
    ? await getProfessionalProfileByUserId(user.id)
    : null;

  if (existingProfessionalProfile) {
    redirect("/pro");
  }

  const displayName = firstValue(params.displayName) ?? user?.email?.split("@")[0] ?? "";
  const redirectTo = normalizeInternalPath(firstValue(params.redirectTo));
  const error = firstValue(params.error);
  const feedback = error ? messageMap[error] : firstValue(params.status) ? messageMap[firstValue(params.status) ?? ""] : null;
  const medicalOptions = Object.entries(MEDICAL_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const supportOptions = Object.entries(SUPPORT_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <AppShell title="Compte" currentPath="/account">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form action={createProfessionalAccount} className="surface-section space-y-6">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="space-y-3">
            <div className="eyebrow">Espace professionnel</div>
            <h1 className="editorial-title">Créer une fiche claire, fiable et immédiatement utile.</h1>
            <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
              Votre espace pro sert à publier votre présence dans l&apos;annuaire, exposer vos
              modes de consultation et gérer vos demandes de rendez-vous sans lourdeur inutile.
              La fiche doit rester lisible: une seule famille d&apos;exercice, une seule catégorie visible.
            </p>
          </div>

          {feedback ? (
            <div className="rounded-brand-xl bg-primary/10 px-5 py-4 text-sm leading-7 text-on-primary-container">
              {feedback}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Nom d&apos;usage public
              </span>
              <input
                type="text"
                name="displayName"
                defaultValue={displayName}
                placeholder="Dr. Marie Dupont"
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
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
                placeholder="Dr. / Pr. / Mme"
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
              />
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Pays
              </span>
              <input
                type="text"
                name="country"
                defaultValue="FR"
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm uppercase text-on-surface"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Ville
              </span>
              <input
                type="text"
                name="city"
                placeholder="Paris"
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
              />
            </label>
          </div>

          <ProfessionalTaxonomyFields
            defaultKind="medical"
            medicalOptions={medicalOptions}
            supportOptions={supportOptions}
          />

          <label className="block space-y-2">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Présentation
            </span>
            <textarea
              name="bio"
              rows={5}
              placeholder="Expliquez votre approche, votre spécialité et ce que les patientes peuvent attendre du premier échange."
              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm leading-7 text-on-surface placeholder:text-outline"
            />
          </label>

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
                    defaultChecked={value === "presentiel"}
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
                placeholder="80"
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
              />
            </label>

            <label className="block space-y-2">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Téléphone
              </span>
              <input
                type="tel"
                name="phone"
                placeholder="+33 6 00 00 00 00"
                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
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
              placeholder="https://"
              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
            />
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary sm:w-auto"
          >
            Activer mon espace professionnel
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-low px-5 py-5">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Niveaux d&apos;offre
            </p>
            <div className="mt-4 space-y-3">
              {Object.entries(SUBSCRIPTION_TIER_DEFINITIONS).map(([tier, definition]) => (
                <div
                  key={tier}
                  className="rounded-brand border border-outline-variant/25 bg-surface-container-lowest px-4 py-4"
                >
                  <p className="font-headline text-base font-semibold text-on-surface">
                    {definition.label}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                    {definition.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-brand-xl border border-outline-variant/40 bg-secondary-container/40 px-5 py-5 text-sm leading-7 text-on-surface-variant">
            L&apos;activation démarre avec le socle de base. L&apos;équipe ROSE-SEIN peut ensuite ajuster l&apos;offre active selon le niveau de visibilité souhaité.
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
