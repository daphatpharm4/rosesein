import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const reportReasonOptions = [
  { value: "abuse", label: "Abus ou harcèlement" },
  { value: "misinformation", label: "Information potentiellement dangereuse" },
  { value: "privacy", label: "Atteinte à la vie privée" },
  { value: "impersonation", label: "Usurpation ou faux profil" },
  { value: "other", label: "Autre motif" },
] as const;

export const moderationActionOptions = [
  { value: "review_note", label: "Ajouter une note de revue" },
  { value: "warn_member", label: "Tracer un avertissement" },
  { value: "close_report", label: "Clore le signalement" },
  { value: "escalate", label: "Escalader au niveau sévère" },
] as const;

export type ReportReason = (typeof reportReasonOptions)[number]["value"];
export type ModerationActionType = (typeof moderationActionOptions)[number]["value"];
export type ReportStatus = "open" | "reviewing" | "resolved" | "escalated";
export type ReportSeverity = "low" | "medium" | "high" | "severe";

type ReportRow = {
  id: string;
  reporter_id: string;
  target_user_id: string | null;
  thread_id: string;
  message_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  severity: ReportSeverity;
  escalation_target: string | null;
  escalation_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type ModerationActionRow = {
  id: string;
  report_id: string;
  moderator_id: string;
  action_type: ModerationActionType;
  notes: string | null;
  escalation_target: string | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ThreadRow = {
  id: string;
  title: string | null;
  kind: "association" | "direct" | "group" | "mentorship";
};

type ProfileRow = {
  id: string;
  display_name: string;
  pseudonym: string | null;
};

export type ModerationActionRecord = {
  id: string;
  actionType: ModerationActionType;
  actionLabel: string;
  notes: string | null;
  escalationTarget: string | null;
  moderatorName: string;
  createdAtLabel: string;
};

export type ModerationQueueItem = {
  id: string;
  reporterName: string;
  targetName: string;
  threadName: string;
  messagePreview: string;
  reason: ReportReason;
  reasonLabel: string;
  details: string | null;
  status: ReportStatus;
  severity: ReportSeverity;
  escalationTarget: string | null;
  escalationNotes: string | null;
  createdAtLabel: string;
  reviewedAtLabel: string | null;
  actions: ModerationActionRecord[];
};

function getReasonLabel(reason: ReportReason) {
  return reportReasonOptions.find((option) => option.value === reason)?.label ?? reason;
}

function getActionLabel(action: ModerationActionType) {
  return moderationActionOptions.find((option) => option.value === action)?.label ?? action;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getThreadLabel(thread: ThreadRow | undefined) {
  if (!thread) {
    return "Conversation protégée";
  }

  if (thread.title) {
    return thread.title;
  }

  if (thread.kind === "association") {
    return "Association ROSE-SEIN";
  }

  if (thread.kind === "direct") {
    return "Conversation privée";
  }

  return "Groupe ROSE-SEIN";
}

function getProfileName(profile: ProfileRow | undefined) {
  if (!profile) {
    return "Membre ROSE-SEIN";
  }

  return profile.display_name;
}

function getMessagePreview(message: MessageRow | undefined) {
  if (!message) {
    return "Message d'origine indisponible.";
  }

  return message.body.length > 160 ? `${message.body.slice(0, 157)}...` : message.body;
}

export async function getModerationQueue(): Promise<ModerationQueueItem[]> {
  await requireStaff("/admin/moderation");
  const supabase = await createSupabaseServerClient();
  const { data: reports } = await supabase
    .from("content_reports")
    .select(
      "id, reporter_id, target_user_id, thread_id, message_id, reason, details, status, severity, escalation_target, escalation_notes, created_at, reviewed_at",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  const reportRows = (reports ?? []) as ReportRow[];
  if (reportRows.length === 0) {
    return [];
  }

  const reportIds = reportRows.map((report) => report.id);
  const threadIds = Array.from(new Set(reportRows.map((report) => report.thread_id)));
  const messageIds = Array.from(new Set(reportRows.map((report) => report.message_id)));

  const [{ data: actions }, { data: threads }, { data: messages }] = await Promise.all([
    supabase
      .from("moderation_actions")
      .select("id, report_id, moderator_id, action_type, notes, escalation_target, created_at")
      .in("report_id", reportIds)
      .order("created_at", { ascending: false }),
    supabase.from("conversation_threads").select("id, title, kind").in("id", threadIds),
    supabase.from("messages").select("id, thread_id, sender_id, body, created_at").in("id", messageIds),
  ]);

  const actionRows = (actions ?? []) as ModerationActionRow[];
  const userIds = Array.from(
    new Set(
      reportRows.flatMap((report) => [report.reporter_id, report.target_user_id]).concat(
        actionRows.map((action) => action.moderator_id),
      ),
    ),
  ).filter((value): value is string => Boolean(value));
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, display_name, pseudonym").in("id", userIds)
      : { data: [] };
  const threadMap = new Map(((threads ?? []) as ThreadRow[]).map((thread) => [thread.id, thread]));
  const messageMap = new Map(((messages ?? []) as MessageRow[]).map((message) => [message.id, message]));
  const profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  const actionsByReport = new Map<string, ModerationActionRow[]>();

  for (const action of actionRows) {
    const existing = actionsByReport.get(action.report_id) ?? [];
    existing.push(action);
    actionsByReport.set(action.report_id, existing);
  }

  return reportRows.map((report) => ({
    id: report.id,
    reporterName: getProfileName(profileMap.get(report.reporter_id)),
    targetName: getProfileName(profileMap.get(report.target_user_id ?? "")),
    threadName: getThreadLabel(threadMap.get(report.thread_id)),
    messagePreview: getMessagePreview(messageMap.get(report.message_id)),
    reason: report.reason,
    reasonLabel: getReasonLabel(report.reason),
    details: report.details,
    status: report.status,
    severity: report.severity,
    escalationTarget: report.escalation_target,
    escalationNotes: report.escalation_notes,
    createdAtLabel: formatTimestamp(report.created_at) ?? report.created_at,
    reviewedAtLabel: formatTimestamp(report.reviewed_at),
    actions: (actionsByReport.get(report.id) ?? []).map((action) => ({
      id: action.id,
      actionType: action.action_type,
      actionLabel: getActionLabel(action.action_type),
      notes: action.notes,
      escalationTarget: action.escalation_target,
      moderatorName: getProfileName(profileMap.get(action.moderator_id)),
      createdAtLabel: formatTimestamp(action.created_at) ?? action.created_at,
    })),
  }));
}
