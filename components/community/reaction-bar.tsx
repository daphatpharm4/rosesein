"use client";

import {
  useEffect,
  useId,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";

import type { ReactionsPayload, ReactionKind } from "@/lib/community-reactions";
import {
  applyOptimisticReaction,
  REACTION_KINDS,
  REACTION_META,
} from "@/lib/community-reactions";

type Props = {
  initialPayload: ReactionsPayload;
  onToggle: (kind: ReactionKind) => Promise<ReactionsPayload>;
};

export function ReactionBar({ initialPayload, onToggle }: Props) {
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const [error, setError] = useState<string | null>(null);
  const [openKind, setOpenKind] = useState<ReactionKind | null>(null);
  const [confirmedPayload, setConfirmedPayload] = useState(initialPayload);

  useEffect(() => {
    setConfirmedPayload(initialPayload);
  }, [initialPayload]);

  const [payload, applyOptimistic] = useOptimistic(
    confirmedPayload,
    applyOptimisticReaction
  );

  useEffect(() => {
    if (!openKind) return;

    const openSummary = payload.summary.find((summary) => summary.kind === openKind);
    if (!openSummary || openSummary.count === 0) {
      setOpenKind(null);
    }
  }, [openKind, payload.summary]);

  useEffect(() => {
    if (!openKind) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenKind(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenKind(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openKind]);

  function handleToggle(kind: ReactionKind) {
    startTransition(async () => {
      setError(null);
      applyOptimistic(kind);
      try {
        const nextPayload = await onToggle(kind);
        setConfirmedPayload(nextPayload);
      } catch {
        setError("La réaction n'a pas pu être enregistrée.");
      }
    });
  }

  return (
    <div ref={rootRef} className="space-y-2 pt-3" aria-busy={isPending}>
      <div className="flex flex-wrap gap-2">
        {REACTION_KINDS.map((kind) => {
          const { emoji, label } = REACTION_META[kind];
          const s = payload.summary.find((x) => x.kind === kind)!;
          const isActive = payload.myReaction === kind;
          const isOpen = openKind === kind;

          return (
            <div key={kind} className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleToggle(kind)}
                aria-label={`Réagir : ${label}`}
                aria-pressed={isActive}
                disabled={isPending}
                className={`flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-2 font-label text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${
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

              {s.count > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenKind(isOpen ? null : kind)}
                    aria-expanded={isOpen}
                    aria-controls={`${popoverId}-${kind}`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface-container-low px-3 py-2 font-label text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
                    aria-label={`Voir ${s.count} réaction${s.count > 1 ? "s" : ""} pour ${label}`}
                  >
                    {s.count}
                  </button>

                  {isOpen ? (
                    <div
                      id={`${popoverId}-${kind}`}
                      className="absolute left-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-brand-md border border-outline-variant/30 bg-background/95 p-3 shadow-ambient backdrop-blur-sm"
                    >
                      <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-outline">
                        {label}
                      </p>
                      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                        {s.users.map((user, index) => (
                          <li
                            key={`${user.displayName}-${index}`}
                            className="truncate font-label text-xs text-on-surface-variant"
                          >
                            {user.isAnonymous ? "Anonyme" : user.displayName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div>
      <p
        role="alert"
        aria-live="assertive"
        className={`text-xs font-semibold text-primary ${error ? "" : "sr-only"}`}
      >
        {error ?? ""}
      </p>
    </div>
  );
}
