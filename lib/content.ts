import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const EVENT_TIME_ZONE = "Europe/Paris";

export type EventKind = "evenement" | "atelier" | "webinaire";

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  evenement: "Événement",
  atelier: "Atelier",
  webinaire: "Webinaire",
};

export type PublishedArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
};

export type PublishedEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  locationLabel: string | null;
  publishedAt: string;
  eventKind: EventKind;
  professionalId: string | null;
  hostProfessionalName: string | null;
  hostProfessionalSlug: string | null;
  hostProfessionalTitle: string | null;
};

export type PublicContentSnapshot = {
  configured: boolean;
  articles: PublishedArticle[];
  latestArticle: PublishedArticle | null;
  events: PublishedEvent[];
  nextEvent: PublishedEvent | null;
};

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level?: number }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt: string };

export type FullArticle = PublishedArticle & {
  content: ArticleBlock[];
};

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  published_at: string;
};

type EventRow = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  location_label: string | null;
  published_at: string;
  event_kind: EventKind | null;
  professional_id: string | null;
  professional_profiles?:
    | {
        slug?: string | null;
        title?: string | null;
        profiles?: { display_name?: string | null } | Array<{ display_name?: string | null }> | null;
      }
    | Array<{
        slug?: string | null;
        title?: string | null;
        profiles?: { display_name?: string | null } | Array<{ display_name?: string | null }> | null;
      }>
    | null;
};

function getRelationObject<T extends object>(relation: T | T[] | null | undefined): T | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function toArticle(row: ArticleRow): PublishedArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    publishedAt: row.published_at,
  };
}

function toEvent(row: EventRow): PublishedEvent {
  const professionalRelation = getRelationObject(row.professional_profiles);
  const hostProfileRelation = getRelationObject(professionalRelation?.profiles);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    locationLabel: row.location_label,
    publishedAt: row.published_at,
    eventKind: row.event_kind ?? "evenement",
    professionalId: row.professional_id,
    hostProfessionalName: hostProfileRelation?.display_name ?? null,
    hostProfessionalSlug: professionalRelation?.slug ?? null,
    hostProfessionalTitle: professionalRelation?.title ?? null,
  };
}

export async function getPublicContentSnapshot(): Promise<PublicContentSnapshot> {
  if (!hasSupabaseBrowserEnv()) {
    return {
      configured: false,
      articles: [],
      latestArticle: null,
      events: [],
      nextEvent: null,
    };
  }

  const supabase = createSupabasePublicClient();
  const nowIso = new Date().toISOString();

  const [{ data: articleRows }, { data: eventRows }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, slug, title, summary, category, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(20),
    supabase
      .from("events")
      .select(
        `
          id,
          title,
          description,
          starts_at,
          ends_at,
          location_label,
          published_at,
          event_kind,
          professional_id,
          professional_profiles(slug, title, profiles(display_name))
        `,
      )
      .not("published_at", "is", null)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(6),
  ]);

  const articles = ((articleRows ?? []) as ArticleRow[]).map(toArticle);
  const events = ((eventRows ?? []) as EventRow[]).map(toEvent);

  return {
    configured: true,
    articles,
    latestArticle: articles[0] ?? null,
    events,
    nextEvent: events[0] ?? null,
  };
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

function parseContent(raw: unknown): ArticleBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isArticleBlock);
}

export async function getArticleBySlug(slug: string): Promise<FullArticle | null> {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const supabase = createSupabasePublicClient();

  const { data: row, error } = await supabase
    .from("articles")
    .select("id, slug, title, summary, category, content, published_at")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();

  if (error) {
    console.error("[getArticleBySlug] Supabase error:", error.message);
    return null;
  }

  if (!row) {
    return null;
  }

  const r = row as ArticleRow & { content: unknown };

  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    category: r.category,
    publishedAt: r.published_at,
    content: parseContent(r.content),
  };
}

export function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatEventSchedule(
  event: Pick<PublishedEvent, "startsAt" | "endsAt">,
) {
  const startsAt = new Date(event.startsAt);
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;

  const sameDay =
    endsAt &&
    startsAt.getFullYear() === endsAt.getFullYear() &&
    startsAt.getMonth() === endsAt.getMonth() &&
    startsAt.getDate() === endsAt.getDate();

  if (endsAt && sameDay) {
    const dateLabel = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: EVENT_TIME_ZONE,
    }).format(startsAt);

    const startTime = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: EVENT_TIME_ZONE,
    }).format(startsAt);

    const endTime = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: EVENT_TIME_ZONE,
    }).format(endsAt);

    return `${dateLabel} · ${startTime} - ${endTime}`;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: EVENT_TIME_ZONE,
  }).format(startsAt);
}
