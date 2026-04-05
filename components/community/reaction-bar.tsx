"use client";

import { useOptimistic, useTransition } from "react";

import type { ReactionsPayload, ReactionKind } from "@/lib/communaute";
import { REACTION_KINDS, REACTION_META } from "@/lib/communaute";

type Props = {
  initialPayload: ReactionsPayload;
  onToggle: (kind: ReactionKind) => Promise<void>;
};

export function ReactionBar({ initialPayload, onToggle }: Props) {
  const [, startTransition] = useTransition();

  const [payload, applyOptimistic] = useOptimistic(
    initialPayload,
    (current: ReactionsPayload, tapped: ReactionKind): ReactionsPayload => {
      const removing = current.myReaction === tapped;
      return {
        myReaction: removing ? null : tapped,
        summary: current.summary.map((s) => {
          if (s.kind === tapped) {
            return { ...s, count: removing ? s.count - 1 : s.count + 1 };
          }
          // if replacing a previous reaction, decrement the old one
          if (!removing && s.kind === current.myReaction) {
            return { ...s, count: s.count - 1 };
          }
          return s;
        }),
      };
    }
  );

  function handleToggle(kind: ReactionKind) {
    startTransition(async () => {
      applyOptimistic(kind);
      await onToggle(kind);
    });
  }

  return (
    <div className="flex flex-wrap gap-2 pt-3">
      {REACTION_KINDS.map((kind) => {
        const { emoji, label } = REACTION_META[kind];
        const s = payload.summary.find((x) => x.kind === kind)!;
        const isActive = payload.myReaction === kind;

        return (
          <div key={kind} className="flex items-center gap-0.5">
            {/* Reaction toggle button */}
            <button
              type="button"
              onClick={() => handleToggle(kind)}
              aria-label={`Réagir : ${label}`}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : s.count > 0
                    ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    : "bg-surface-container-low text-outline hover:bg-surface-container"
              }`}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{label}</span>
            </button>

            {/* Count + popover */}
            {s.count > 0 && (
              <details className="relative">
                <summary
                  className="list-none cursor-pointer rounded-full px-2 py-1.5 font-label text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                  aria-label={`${s.count} réaction${s.count > 1 ? "s" : ""} — voir qui a réagi`}
                >
                  {s.count}
                </summary>
                <div className="glass-panel absolute bottom-9 left-0 z-50 min-w-[10rem] rounded-brand-md p-3 shadow-ambient">
                  <ul className="space-y-1">
                    {s.users.map((u, i) => (
                      <li key={i} className="font-label text-xs text-on-surface-variant">
                        {u.isAnonymous ? "Anonyme" : u.displayName}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
