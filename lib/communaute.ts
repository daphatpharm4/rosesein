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
