import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { ArticleBlock } from "@/lib/content";

export type ResourceCategory = "nutrition" | "activite" | "beaute" | "psychologie";
export type ResourceFormat = "article" | "video" | "exercise";
export type ResourceDifficulty = "gentle" | "moderate" | "active";

export type PublishedResource = {
  id: string;
  category: ResourceCategory;
  title: string;
  summary: string;
  format: ResourceFormat;
  difficulty: ResourceDifficulty;
  publishedAt: string;
};

export type FullResource = PublishedResource & {
  content: ArticleBlock[];
};

export type ResourceCategoryCounts = Record<ResourceCategory, number>;

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  nutrition: "Nutrition",
  activite: "Activité physique",
  beaute: "Beauté & image",
  psychologie: "Soutien psychologique",
};

const CATEGORY_DESCRIPTIONS: Record<ResourceCategory, string> = {
  nutrition: "Conseils alimentaires, recettes adaptées et repères pour manger avec douceur pendant les traitements.",
  activite: "Programmes de mouvement doux, vidéos guidées et exercices adaptés à votre niveau d'énergie.",
  beaute: "Soins de la peau, conseils coiffure, ateliers socio-esthétiques et gestes beauté bienveillants.",
  psychologie: "Exercices de respiration, journal personnel, méditation et orientation vers un soutien professionnel.",
};

export function getCategoryLabel(category: ResourceCategory): string {
  return CATEGORY_LABELS[category];
}

export function getCategoryDescription(category: ResourceCategory): string {
  return CATEGORY_DESCRIPTIONS[category];
}

export function isResourceCategory(value: string): value is ResourceCategory {
  return ["nutrition", "activite", "beaute", "psychologie"].includes(value);
}

type ResourceRow = {
  id: string;
  category: string;
  title: string;
  summary: string;
  format: string;
  difficulty: string;
  published_at: string;
};

function toPublishedResource(row: ResourceRow): PublishedResource {
  return {
    id: row.id,
    category: row.category as ResourceCategory,
    title: row.title,
    summary: row.summary,
    format: row.format as ResourceFormat,
    difficulty: row.difficulty as ResourceDifficulty,
    publishedAt: row.published_at,
  };
}

export async function getResourceCategoryCounts(): Promise<ResourceCategoryCounts> {
  const empty: ResourceCategoryCounts = { nutrition: 0, activite: 0, beaute: 0, psychologie: 0 };
  if (!hasSupabaseBrowserEnv()) return empty;

  const supabase = createSupabasePublicClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("resources")
    .select("category")
    .not("published_at", "is", null)
    .lte("published_at", nowIso);

  if (!data) return empty;

  return (data as { category: string }[]).reduce(
    (acc, row) => {
      const cat = row.category as ResourceCategory;
      if (cat in acc) acc[cat]++;
      return acc;
    },
    { ...empty },
  );
}

export async function getResourcesByCategory(
  category: ResourceCategory,
): Promise<PublishedResource[]> {
  if (!hasSupabaseBrowserEnv()) return [];

  const supabase = createSupabasePublicClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("resources")
    .select("id, category, title, summary, format, difficulty, published_at")
    .eq("category", category)
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false });

  return ((data ?? []) as ResourceRow[]).map(toPublishedResource);
}

function isArticleBlock(value: unknown): value is ArticleBlock {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.type !== "string") return false;
  switch (v.type) {
    case "paragraph":
    case "quote":
      return typeof v.text === "string";
    case "heading":
      return typeof v.text === "string";
    case "image":
      return typeof v.src === "string" && typeof v.alt === "string";
    default:
      return false;
  }
}

export async function getResourceById(id: string): Promise<FullResource | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = createSupabasePublicClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("resources")
    .select("id, category, title, summary, format, difficulty, content, published_at")
    .eq("id", id)
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .maybeSingle();

  if (!data) return null;
  const r = data as ResourceRow & { content: unknown };

  return {
    ...toPublishedResource(r),
    content: Array.isArray(r.content)
      ? (r.content as unknown[]).filter(isArticleBlock)
      : [],
  };
}

export function formatDifficulty(difficulty: ResourceDifficulty): string {
  return { gentle: "Doux", moderate: "Modéré", active: "Actif" }[difficulty];
}

export function formatFormat(format: ResourceFormat): string {
  return { article: "Article", video: "Vidéo", exercise: "Exercice" }[format];
}
