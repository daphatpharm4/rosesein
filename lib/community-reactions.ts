export type ReactionKind = "touche" | "pense" | "courage" | "merci";

export type ReactionSummary = {
  kind: ReactionKind;
  count: number;
  users: { displayName: string; isAnonymous: boolean }[];
};

export type ReactionsPayload = {
  summary: ReactionSummary[];
  myReaction: ReactionKind | null;
};

export const REACTION_KINDS: ReactionKind[] = ["touche", "pense", "courage", "merci"];

export const REACTION_META: Record<ReactionKind, { emoji: string; label: string }> = {
  touche: { emoji: "❤️", label: "Touché(e)" },
  pense: { emoji: "🕯️", label: "Je pense à vous" },
  courage: { emoji: "💪", label: "Courage" },
  merci: { emoji: "🙏", label: "Merci" },
};

export function applyOptimisticReaction(
  current: ReactionsPayload,
  tapped: ReactionKind
): ReactionsPayload {
  const removing = current.myReaction === tapped;

  return {
    myReaction: removing ? null : tapped,
    summary: current.summary.map((summary) => {
      let count = summary.count;

      if (summary.kind === tapped) {
        count += removing ? -1 : 1;
      }

      if (!removing && summary.kind === current.myReaction) {
        count -= 1;
      }

      return {
        ...summary,
        count: Math.max(0, count),
      };
    }),
  };
}

export function makeEmptyPayload(): ReactionsPayload {
  return {
    summary: REACTION_KINDS.map((kind) => ({ kind, count: 0, users: [] })),
    myReaction: null,
  };
}
