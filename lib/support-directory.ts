import "server-only";

import type { ResourceCategory } from "@/lib/soins";

export type SupportDirectoryEntry = {
  title: string;
  subtitle: string;
  location: string;
  href?: string;
};

const DIRECTORY: Record<ResourceCategory, SupportDirectoryEntry[]> = {
  nutrition: [
    {
      title: "Atelier nutrition douce",
      subtitle: "Cuisine simple pendant les traitements",
      location: "En ligne · jeudi 18h30",
    },
    {
      title: "Consultation diététique partenaire",
      subtitle: "Repères contre fatigue, nausées et perte d'appétit",
      location: "Maison des patientes · Lyon",
    },
  ],
  activite: [
    {
      title: "Séance adaptée basse énergie",
      subtitle: "Mouvement guidé pour jours de fatigue",
      location: "Visio · mardi 10h00",
    },
    {
      title: "Atelier reprise en douceur",
      subtitle: "Mobilité et respiration",
      location: "Association ROSE-SEIN · Paris",
    },
  ],
  beaute: [
    {
      title: "Atelier socio-esthétique",
      subtitle: "Peau, sourcils, gestes qui redonnent de l'élan",
      location: "En ligne · vendredi 14h00",
    },
    {
      title: "Tutoriel image de soi",
      subtitle: "Routines très courtes pour jours sans énergie",
      location: "Replay disponible",
    },
  ],
  psychologie: [
    {
      title: "Psychologue partenaire",
      subtitle: "Orientation psycho-oncologie",
      location: "Téléconsultation ou présentiel",
    },
    {
      title: "Respiration guidée du soir",
      subtitle: "Apaiser l'anticipation et les réveils nocturnes",
      location: "Audio 8 minutes",
    },
  ],
};

export function getSupportDirectoryEntries(category: ResourceCategory) {
  return DIRECTORY[category];
}
