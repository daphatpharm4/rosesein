import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Dumbbell, HeartPulse, Leaf, Smile } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { getResourceCategoryCounts } from "@/lib/soins";
import type { ResourceCategory } from "@/lib/soins";

export const revalidate = 300;

const CATEGORY_CONFIG: {
  category: ResourceCategory;
  label: string;
  description: string;
  icon: typeof Leaf;
  tone: string;
}[] = [
  {
    category: "nutrition",
    label: "Nutrition",
    description: "Conseils alimentaires et recettes adaptées aux traitements.",
    icon: Leaf,
    tone: "bg-sage-container text-on-sage",
  },
  {
    category: "activite",
    label: "Activité physique",
    description: "Programmes doux, vidéos guidées et exercices adaptés.",
    icon: Dumbbell,
    tone: "bg-tertiary/20 text-on-surface",
  },
  {
    category: "beaute",
    label: "Beauté & image",
    description: "Soins de la peau, conseils coiffure, ateliers socio-esthétiques.",
    icon: Smile,
    tone: "bg-primary-container/25 text-primary",
  },
  {
    category: "psychologie",
    label: "Soutien psychologique",
    description: "Respiration, journal personnel, méditation et orientation professionnelle.",
    icon: HeartPulse,
    tone: "bg-primary/10 text-primary",
  },
];

export default async function SoisHubPage() {
  const counts = await getResourceCategoryCounts();

  return (
    <AppShell title="Soins de support" currentPath="/soins">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Prendre soin de soi</div>
          <h1 className="editorial-title">Des ressources pensées pour votre parcours.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Nutrition, activité physique, image de soi, soutien psychologique — chaque
            espace rassemble des contenus validés, adaptés aux réalités du traitement.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORY_CONFIG.map(({ category, label, description, icon: Icon, tone }) => (
            <Link key={category} href={`/soins/${category}` as Route} className="surface-card group space-y-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}>
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">{label}</h2>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">{description}</p>
                <p className="mt-2 font-label text-xs font-semibold uppercase tracking-[0.16em] text-outline">
                  {counts[category]} ressource{counts[category] !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary">
                Explorer
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.8} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
