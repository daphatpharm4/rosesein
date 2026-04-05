import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CommunityKind = "patient" | "caregiver" | "all";

export type CommunitySpace = {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconName: string;
  allowedKind: CommunityKind;
  sortOrder: number;
  threadCount: number;
};

export type CommunityThread = {
  id: string;
  spaceId: string;
  title: string;
  body: string;
  createdBy: string;
  pinned: boolean;
  createdAt: string;
  replyCount: number;
};

export type CommunityReply = {
  id: string;
  threadId: string;
  authorId: string;
  authorDisplayName: string;
  body: string;
  isAnonymous: boolean;
  createdAt: string;
};

export type SpaceWithThreads = {
  space: CommunitySpace;
  threads: CommunityThread[];
};

export type ThreadWithReplies = {
  thread: CommunityThread & { spaceSlug: string; spaceTitle: string };
  replies: CommunityReply[];
};

export async function getCommunitySpaces(): Promise<CommunitySpace[]> {
  if (!hasSupabaseBrowserEnv()) return [];

  const supabase = await createSupabaseServerClient();

  const { data: spaces } = await supabase
    .from("community_spaces")
    .select("id, slug, title, description, icon_name, allowed_kind, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!spaces) return [];

  const spaceIds = spaces.map((s) => s.id as string);

  const { data: threadCounts } = await supabase
    .from("community_threads")
    .select("space_id")
    .in("space_id", spaceIds);

  const countMap = new Map<string, number>();
  for (const row of threadCounts ?? []) {
    const id = (row as { space_id: string }).space_id;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  return (spaces as {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon_name: string;
    allowed_kind: string;
    sort_order: number;
  }[]).map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    iconName: s.icon_name,
    allowedKind: s.allowed_kind as CommunityKind,
    sortOrder: s.sort_order,
    threadCount: countMap.get(s.id) ?? 0,
  }));
}

export async function getSpaceWithThreads(slug: string): Promise<SpaceWithThreads | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = await createSupabaseServerClient();

  const { data: space } = await supabase
    .from("community_spaces")
    .select("id, slug, title, description, icon_name, allowed_kind, sort_order")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!space) return null;

  const s = space as {
    id: string; slug: string; title: string; description: string;
    icon_name: string; allowed_kind: string; sort_order: number;
  };

  const { data: threads } = await supabase
    .from("community_threads")
    .select("id, space_id, title, body, created_by, pinned, created_at")
    .eq("space_id", s.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const threadIds = (threads ?? []).map((t) => (t as { id: string }).id);

  const { data: replyCounts } = await supabase
    .from("community_replies")
    .select("thread_id")
    .in(
      "thread_id",
      threadIds.length > 0 ? threadIds : ["00000000-0000-0000-0000-000000000000"],
    );

  const replyMap = new Map<string, number>();
  for (const row of replyCounts ?? []) {
    const id = (row as { thread_id: string }).thread_id;
    replyMap.set(id, (replyMap.get(id) ?? 0) + 1);
  }

  return {
    space: {
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      iconName: s.icon_name,
      allowedKind: s.allowed_kind as CommunityKind,
      sortOrder: s.sort_order,
      threadCount: (threads ?? []).length,
    },
    threads: (
      (threads ?? []) as {
        id: string; space_id: string; title: string; body: string;
        created_by: string; pinned: boolean; created_at: string;
      }[]
    ).map((t) => ({
      id: t.id,
      spaceId: t.space_id,
      title: t.title,
      body: t.body,
      createdBy: t.created_by,
      pinned: t.pinned,
      createdAt: t.created_at,
      replyCount: replyMap.get(t.id) ?? 0,
    })),
  };
}

export async function getThreadWithReplies(
  threadId: string,
): Promise<ThreadWithReplies | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = await createSupabaseServerClient();

  const { data: thread } = await supabase
    .from("community_threads")
    .select(
      "id, space_id, title, body, created_by, pinned, created_at, community_spaces(slug, title)",
    )
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return null;

  const t = thread as unknown as {
    id: string; space_id: string; title: string; body: string;
    created_by: string; pinned: boolean; created_at: string;
    community_spaces: { slug: string; title: string } | null;
  };

  const { data: replies } = await supabase
    .from("community_replies")
    .select(
      "id, thread_id, author_id, body, is_anonymous, created_at, profiles(display_name, pseudonym, is_anonymous)",
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return {
    thread: {
      id: t.id,
      spaceId: t.space_id,
      title: t.title,
      body: t.body,
      createdBy: t.created_by,
      pinned: t.pinned,
      createdAt: t.created_at,
      replyCount: (replies ?? []).length,
      spaceSlug: t.community_spaces?.slug ?? "",
      spaceTitle: t.community_spaces?.title ?? "",
    },
    replies: (
      (replies ?? []) as unknown as {
        id: string; thread_id: string; author_id: string; body: string;
        is_anonymous: boolean; created_at: string;
        profiles: {
          display_name: string; pseudonym: string | null; is_anonymous: boolean;
        } | null;
      }[]
    ).map((r) => {
      const showAnon = r.is_anonymous || (r.profiles?.is_anonymous ?? false);
      const name = showAnon
        ? "Membre anonyme"
        : (r.profiles?.pseudonym ?? r.profiles?.display_name ?? "Membre");
      return {
        id: r.id,
        threadId: r.thread_id,
        authorId: r.author_id,
        authorDisplayName: name,
        body: r.body,
        isAnonymous: showAnon,
        createdAt: r.created_at,
      };
    }),
  };
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export type ReactionKind = "touche" | "pense" | "courage" | "merci";

export type ReactionSummary = {
  kind: ReactionKind;
  count: number;
  users: { displayName: string; isAnonymous: boolean }[];
};

export type ReactionsPayload = {
  summary: ReactionSummary[];   // always all 4 kinds; count 0 if none
  myReaction: ReactionKind | null;
};

export const REACTION_KINDS: ReactionKind[] = ["touche", "pense", "courage", "merci"];

export const REACTION_META: Record<ReactionKind, { emoji: string; label: string }> = {
  touche:  { emoji: "❤️",  label: "Touché(e)" },
  pense:   { emoji: "🕯️", label: "Je pense à vous" },
  courage: { emoji: "💪",  label: "Courage" },
  merci:   { emoji: "🙏",  label: "Merci" },
};

function makeEmptyPayload(): ReactionsPayload {
  return {
    summary: REACTION_KINDS.map((kind) => ({ kind, count: 0, users: [] })),
    myReaction: null,
  };
}

type ReactionRow = {
  kind: string;
  user_id: string;
  profiles: {
    display_name: string;
    pseudonym: string | null;
    is_anonymous: boolean;
  } | null;
};

function aggregateReactions(
  rows: ReactionRow[],
  currentUserId: string | null
): ReactionsPayload {
  const summaryMap = Object.fromEntries(
    REACTION_KINDS.map((kind): [ReactionKind, ReactionSummary] => [
      kind,
      { kind, count: 0, users: [] },
    ])
  ) as Record<ReactionKind, ReactionSummary>;

  let myReaction: ReactionKind | null = null;

  for (const row of rows) {
    const kind = row.kind as ReactionKind;
    summaryMap[kind].count++;
    const p = row.profiles;
    const displayName = p?.is_anonymous
      ? (p.pseudonym ?? "Anonyme")
      : (p?.display_name ?? "Membre");
    summaryMap[kind].users.push({
      displayName,
      isAnonymous: p?.is_anonymous ?? false,
    });
    if (currentUserId && row.user_id === currentUserId) myReaction = kind;
  }

  return { summary: Object.values(summaryMap), myReaction };
}

export async function getThreadReactionsMap(
  threadIds: string[]
): Promise<Record<string, ReactionsPayload>> {
  const empty = Object.fromEntries(threadIds.map((id) => [id, makeEmptyPayload()]));
  if (!hasSupabaseBrowserEnv() || threadIds.length === 0) return empty;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("community_thread_reactions")
    .select("thread_id, kind, user_id, profiles(display_name, pseudonym, is_anonymous)")
    .in("thread_id", threadIds);

  if (!data) return empty;

  const result: Record<string, ReactionsPayload> = Object.fromEntries(
    threadIds.map((id) => [id, makeEmptyPayload()])
  );

  const byThread = (
    data as unknown as Array<ReactionRow & { thread_id: string }>
  ).reduce<Record<string, ReactionRow[]>>((acc, row) => {
    const tid = row.thread_id;
    (acc[tid] ??= []).push(row);
    return acc;
  }, {});

  for (const [tid, rows] of Object.entries(byThread)) {
    if (tid in result) result[tid] = aggregateReactions(rows, user?.id ?? null);
  }

  return result;
}

export async function getReplyReactionsMap(
  replyIds: string[]
): Promise<Record<string, ReactionsPayload>> {
  const empty = Object.fromEntries(replyIds.map((id) => [id, makeEmptyPayload()]));
  if (!hasSupabaseBrowserEnv() || replyIds.length === 0) return empty;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("community_reply_reactions")
    .select("reply_id, kind, user_id, profiles(display_name, pseudonym, is_anonymous)")
    .in("reply_id", replyIds);

  if (!data) return empty;

  const result: Record<string, ReactionsPayload> = Object.fromEntries(
    replyIds.map((id) => [id, makeEmptyPayload()])
  );

  const byReply = (
    data as unknown as Array<ReactionRow & { reply_id: string }>
  ).reduce<Record<string, ReactionRow[]>>((acc, row) => {
    const rid = row.reply_id;
    (acc[rid] ??= []).push(row);
    return acc;
  }, {});

  for (const [rid, rows] of Object.entries(byReply)) {
    if (rid in result) result[rid] = aggregateReactions(rows, user?.id ?? null);
  }

  return result;
}
