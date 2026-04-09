"use client";

import { BriefcaseMedical, HeartHandshake } from "lucide-react";
import { useId, useState } from "react";

type CategoryOption = {
  value: string;
  label: string;
};

type ProfessionalTaxonomyFieldsProps = {
  defaultKind: "medical" | "support_care";
  defaultMedicalCategory?: string | null;
  defaultSupportCategory?: string | null;
  medicalOptions: CategoryOption[];
  supportOptions: CategoryOption[];
};

export function ProfessionalTaxonomyFields({
  defaultKind,
  defaultMedicalCategory,
  defaultSupportCategory,
  medicalOptions,
  supportOptions,
}: ProfessionalTaxonomyFieldsProps) {
  const [kind, setKind] = useState<"medical" | "support_care">(defaultKind);
  const [medicalCategory, setMedicalCategory] = useState(defaultMedicalCategory ?? "");
  const [supportCategory, setSupportCategory] = useState(defaultSupportCategory ?? "");
  const hintId = useId();
  const noteId = useId();

  return (
    <fieldset className="space-y-4">
      <legend className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
        Cadre principal d&apos;exercice
      </legend>
      <p id={hintId} className="max-w-2xl text-sm leading-7 text-on-surface-variant">
        Une fiche professionnelle doit relever d&apos;un seul cadre visible dans l&apos;annuaire:
        catégorie médicale ou soins de support. Choisissez celui qui oriente le premier contact.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label
          className={`block cursor-pointer rounded-brand border px-4 py-4 transition-colors ${
            kind === "medical"
              ? "border-primary/35 bg-primary/8"
              : "border-outline-variant/25 bg-surface-container-lowest hover:border-primary/18 hover:bg-white"
          }`}
        >
          <input
            type="radio"
            name="professionalKind"
            value="medical"
            checked={kind === "medical"}
            onChange={() => setKind("medical")}
            className="sr-only"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BriefcaseMedical aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="space-y-1">
              <p className="font-headline text-lg font-semibold text-on-surface">
                Catégorie médicale
              </p>
              <p className="text-sm leading-7 text-on-surface-variant">
                Pour les professionnelles et professionnels inscrits dans le parcours de soins.
              </p>
            </div>
          </div>
        </label>

        <label
          className={`block cursor-pointer rounded-brand border px-4 py-4 transition-colors ${
            kind === "support_care"
              ? "border-primary/35 bg-primary/8"
              : "border-outline-variant/25 bg-surface-container-lowest hover:border-primary/18 hover:bg-white"
          }`}
        >
          <input
            type="radio"
            name="professionalKind"
            value="support_care"
            checked={kind === "support_care"}
            onChange={() => setKind("support_care")}
            className="sr-only"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <HeartHandshake aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="space-y-1">
              <p className="font-headline text-lg font-semibold text-on-surface">
                Soins de support
              </p>
              <p className="text-sm leading-7 text-on-surface-variant">
                Pour les approches d&apos;accompagnement complémentaire au suivi médical.
              </p>
            </div>
          </div>
        </label>
      </div>

      <div className="rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
        {kind === "medical" ? (
          <label className="block space-y-2">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Catégorie médicale
            </span>
            <select
              name="medicalCategory"
              value={medicalCategory}
              onChange={(event) => setMedicalCategory(event.target.value)}
              aria-describedby={`${hintId} ${noteId}`}
              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
              required
            >
              <option value="">Choisir une catégorie médicale</option>
              {medicalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block space-y-2">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Soins de support
            </span>
            <select
              name="supportCategory"
              value={supportCategory}
              onChange={(event) => setSupportCategory(event.target.value)}
              aria-describedby={`${hintId} ${noteId}`}
              className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
              required
            >
              <option value="">Choisir une catégorie de soins de support</option>
              {supportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <p id={noteId} className="mt-3 text-xs leading-6 text-on-surface-variant">
          Une seule catégorie est publiée sur la fiche pour éviter toute ambiguïté. Si votre
          pratique croise plusieurs dimensions, retenez celle qui structure d&apos;abord la prise
          de rendez-vous.
        </p>
      </div>
    </fieldset>
  );
}
