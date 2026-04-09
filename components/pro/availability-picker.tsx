import { CalendarDays, Clock3, MapPin, Phone, Video } from "lucide-react";

import { CONSULTATION_MODE_LABELS } from "@/lib/professional";
import type { Availability } from "@/lib/professional-agenda";

function formatSlotDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function formatSlotTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AvailabilityPicker({
  availabilities,
  inputName = "availabilityId",
}: {
  availabilities: Availability[];
  inputName?: string;
}) {
  return (
    <div className="space-y-3">
      {availabilities.map((availability) => {
        const modeLabel = CONSULTATION_MODE_LABELS[availability.consultationMode];

        return (
          <label
            key={availability.id}
            className="flex cursor-pointer items-start gap-3 rounded-brand border border-outline-variant/25 bg-surface-container-lowest px-4 py-4 transition-colors hover:border-primary/20 hover:bg-white"
          >
            <input
              type="radio"
              name={inputName}
              value={availability.id}
              required
              className="mt-1 h-4 w-4 border-outline-variant text-primary focus:ring-primary/20"
            />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary">
                  <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {formatSlotDate(availability.startsAt)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm leading-6 text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                  {formatSlotTime(availability.startsAt)} – {formatSlotTime(availability.endsAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {availability.consultationMode === "visio" ? (
                    <Video aria-hidden="true" className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                  ) : availability.consultationMode === "telephone" ? (
                    <Phone aria-hidden="true" className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                  ) : (
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                  )}
                  {modeLabel}
                </span>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
