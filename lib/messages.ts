import { notFound } from "next/navigation";

import {
  PROFILE_KIND_LABELS,
  requireCompletedProfile,
  type ProfileKind,
  type UserProfile,
} from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConversationKind = "association" | "direct" | "group";
export type ConversationScope = "association" | "private";

export type Conversation = {
  id: string;
  href: string;
  name: string;
  preview: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
  kind: ConversationKind;
  scope: ConversationScope;
  active?: boolean;
  accent?: "primary" | "secondary";
  initials?: string;
};

export type ThreadParticipant = {
  id: string;
  profileKind: ProfileKind;
  visibleName: string;
  isCurrentUser: boolean;
};

export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  sentAtLabel: string;
  senderId: string;
  senderName: string;
  isCurrentUser: boolean;
};

export type MessageThread = {
  id: string;
  name: string;
  kind: ConversationKind;
  scope: ConversationScope;
  isOfficial: boolean;
  participants: ThreadParticipant[];
  messages: ThreadMessage[];
  canSend: boolean;
};

type ThreadRow = {
  id: string;
  kind: "association" | "direct" | "group" | "mentorship";
  title: string | null;
  is_official: boolean;
  created_at: string;
  updated_at: string;
};

type ParticipantRow = {
  thread_id: string;
  user_id: string;
  joined_at: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  profile_kind: ProfileKind;
  display_name: string;
  pseudonym: string | null;
  is_anonymous: boolean;
};

type InboxSource = {
  currentUserId: string;
  threads: ThreadRow[];
  participants: ParticipantRow[];
  profiles: ProfileRow[];
  messages: MessageRow[];
};

function normalizeThreadKind(kind: ThreadRow["kind"]): ConversationKind {
  if (kind === "association" || kind === "direct") {
    return kind;
  }

  return "group";
}

function getConversationScope(kind: ConversationKind): ConversationScope {
  return kind === "association" ? "association" : "private";
}

function buildProfileMap(profiles: ProfileRow[]) {
  return new Map(profiles.map((profile) => [profile.id, profile]));
}

function getVisibleName(profile: ProfileRow | undefined, currentUserId: string, targetUserId: string) {
  if (!profile) {
    return "Membre ROSE-SEIN";
  }

  if (targetUserId !== currentUserId && profile.is_anonymous && profile.pseudonym) {
    return profile.pseudonym;
  }

  return profile.display_name;
}

function getInitials(label: string) {
  const words = label
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "RS";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function formatConversationTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffInDays = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) {
    return todayLabel.format(date);
  }

  if (diffInDays === 1) {
    return "Hier";
  }

  if (diffInDays >= 0 && diffInDays < 7) {
    return new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatMessageTimestamp(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildThreadName(
  thread: ThreadRow,
  participantRows: ParticipantRow[],
  profileMap: Map<string, ProfileRow>,
  currentUserId: string,
) {
  const kind = normalizeThreadKind(thread.kind);

  if (thread.title) {
    return thread.title;
  }

  if (kind === "association") {
    return "Association ROSE-SEIN";
  }

  const peerNames = participantRows
    .filter((participant) => participant.user_id !== currentUserId)
    .map((participant) =>
      getVisibleName(profileMap.get(participant.user_id), currentUserId, participant.user_id),
    );

  if (kind === "direct") {
    return peerNames[0] ?? "Conversation privée";
  }

  if (peerNames.length > 0) {
    return peerNames.join(", ");
  }

  return "Groupe ROSE-SEIN";
}

function buildConversationPreview(
  lastMessage: MessageRow | undefined,
  thread: ThreadRow,
  threadName: string,
  participants: ParticipantRow[],
  profiles: Map<string, ProfileRow>,
  currentUserId: string,
) {
  if (lastMessage) {
    const senderProfile = profiles.get(lastMessage.sender_id);
    const senderName =
      lastMessage.sender_id === currentUserId
        ? "Vous"
        : getVisibleName(senderProfile, currentUserId, lastMessage.sender_id);

    return `${senderName}: ${lastMessage.body}`;
  }

  if (thread.is_official) {
    return "Discussion officielle ouverte par l'association.";
  }

  if (normalizeThreadKind(thread.kind) === "direct") {
    return `La conversation avec ${threadName} est prête.`;
  }

  return `${participants.length} participant${participants.length > 1 ? "s" : ""} dans cette conversation.`;
}

function buildThreadParticipants(
  participantRows: ParticipantRow[],
  profileMap: Map<string, ProfileRow>,
  currentUserId: string,
) {
  return participantRows.map((participant) => {
    const profile = profileMap.get(participant.user_id);

    return {
      id: participant.user_id,
      profileKind: profile?.profile_kind ?? "patient",
      visibleName: getVisibleName(profile, currentUserId, participant.user_id),
      isCurrentUser: participant.user_id === currentUserId,
    };
  });
}

function buildInboxConversations({
  currentUserId,
  threads,
  participants,
  profiles,
  messages,
}: InboxSource): Conversation[] {
  const profileMap = buildProfileMap(profiles);
  const messagesByThread = new Map<string, MessageRow[]>();
  const participantsByThread = new Map<string, ParticipantRow[]>();

  for (const participant of participants) {
    const existing = participantsByThread.get(participant.thread_id) ?? [];
    existing.push(participant);
    participantsByThread.set(participant.thread_id, existing);
  }

  for (const message of messages) {
    const existing = messagesByThread.get(message.thread_id) ?? [];
    existing.push(message);
    messagesByThread.set(message.thread_id, existing);
  }

  return threads.map((thread, index) => {
    const kind = normalizeThreadKind(thread.kind);
    const scope = getConversationScope(kind);
    const threadParticipants = participantsByThread.get(thread.id) ?? [];
    const threadMessages = messagesByThread.get(thread.id) ?? [];
    const lastMessage = threadMessages[0];
    const threadName = buildThreadName(thread, threadParticipants, profileMap, currentUserId);
    const lastActivity = lastMessage?.created_at ?? thread.updated_at ?? thread.created_at;

    return {
      id: thread.id,
      href: `/messages/${thread.id}`,
      name: threadName,
      preview: buildConversationPreview(
        lastMessage,
        thread,
        threadName,
        threadParticipants,
        profileMap,
        currentUserId,
      ),
      timestamp: formatConversationTimestamp(lastActivity),
      kind,
      scope,
      active: index === 0,
      accent: kind === "association" ? "primary" : "secondary",
      initials: kind === "direct" ? getInitials(threadName) : undefined,
    };
  });
}

async function getAuthorizedThreadIds(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: memberships, error } = await supabase
    .from("thread_participants")
    .select("thread_id")
    .eq("user_id", userId);

  if (error) {
    return [];
  }

  return (memberships ?? []).map((membership) => membership.thread_id as string);
}

async function getInboxSource(userId: string): Promise<InboxSource> {
  const supabase = await createSupabaseServerClient();
  const threadIds = await getAuthorizedThreadIds(userId);

  if (threadIds.length === 0) {
    return {
      currentUserId: userId,
      threads: [],
      participants: [],
      profiles: [],
      messages: [],
    };
  }

  const [{ data: threads }, { data: participants }, { data: messages }] = await Promise.all([
    supabase
      .from("conversation_threads")
      .select("id, kind, title, is_official, created_at, updated_at")
      .in("id", threadIds)
      .order("updated_at", { ascending: false }),
    supabase
      .from("thread_participants")
      .select("thread_id, user_id, joined_at")
      .in("thread_id", threadIds),
    supabase
      .from("messages")
      .select("id, thread_id, sender_id, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
  ]);

  const participantUserIds = Array.from(
    new Set(((participants ?? []) as ParticipantRow[]).map((participant) => participant.user_id)),
  );

  const { data: profiles } =
    participantUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, profile_kind, display_name, pseudonym, is_anonymous")
          .in("id", participantUserIds)
      : { data: [] };

  return {
    currentUserId: userId,
    threads: (threads ?? []) as ThreadRow[],
    participants: (participants ?? []) as ParticipantRow[],
    profiles: (profiles ?? []) as ProfileRow[],
    messages: (messages ?? []) as MessageRow[],
  };
}

export async function getInboxConversations() {
  const { user } = await requireCompletedProfile("/messages");
  const source = await getInboxSource(user.id);
  return buildInboxConversations(source);
}

export async function getThreadById(threadId: string): Promise<MessageThread> {
  const { user } = await requireCompletedProfile(`/messages/${threadId}`);
  const source = await getInboxSource(user.id);
  const thread = source.threads.find((candidate) => candidate.id === threadId);

  if (!thread) {
    notFound();
  }

  const profileMap = buildProfileMap(source.profiles);
  const threadParticipants = source.participants.filter(
    (participant) => participant.thread_id === threadId,
  );
  const threadMessages = source.messages
    .filter((message) => message.thread_id === threadId)
    .sort((left, right) => left.created_at.localeCompare(right.created_at));
  const name = buildThreadName(thread, threadParticipants, profileMap, user.id);
  const participants = buildThreadParticipants(threadParticipants, profileMap, user.id);

  return {
    id: thread.id,
    name,
    kind: normalizeThreadKind(thread.kind),
    scope: getConversationScope(normalizeThreadKind(thread.kind)),
    isOfficial: thread.is_official,
    participants,
    canSend: participants.some((participant) => participant.isCurrentUser),
    messages: threadMessages.map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.created_at,
      sentAtLabel: formatMessageTimestamp(message.created_at),
      senderId: message.sender_id,
      senderName:
        message.sender_id === user.id
          ? "Vous"
          : getVisibleName(profileMap.get(message.sender_id), user.id, message.sender_id),
      isCurrentUser: message.sender_id === user.id,
    })),
  };
}

export function getThreadLead(thread: MessageThread) {
  if (thread.kind === "association") {
    return thread.isOfficial
      ? "Fil officiel géré par l'association"
      : "Conversation d'association";
  }

  if (thread.kind === "direct") {
    return "Échange privé";
  }

  return "Conversation de groupe";
}

export function getAudienceLabel(profile: UserProfile) {
  return PROFILE_KIND_LABELS[profile.profileKind];
}
