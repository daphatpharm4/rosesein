import { EVENT_KIND_LABELS, type EventKind } from "@/lib/content";

const kindClasses: Record<EventKind, string> = {
  evenement:
    "border-secondary-container/80 bg-secondary-container/70 text-on-secondary-container",
  atelier: "border-primary/15 bg-primary/10 text-primary",
  webinaire: "border-outline-variant/35 bg-surface-container-low text-on-surface",
};

export function EventKindBadge({ kind }: { kind: EventKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-label text-[0.72rem] font-semibold uppercase tracking-[0.12em] ${kindClasses[kind]}`}
    >
      {EVENT_KIND_LABELS[kind]}
    </span>
  );
}
