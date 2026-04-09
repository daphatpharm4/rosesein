// components/admin/member-picker.tsx
"use client";

import { useState } from "react";

import type { MemberOption } from "@/lib/admin-messaging";

const profileKindLabels = {
  patient: "Patiente",
  caregiver: "Aidant",
  professional: "Professionnel",
} as const;

type MemberPickerProps = {
  members: MemberOption[];
};

export function MemberPicker({ members }: MemberPickerProps) {
  const [filter, setFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const q = filter.toLowerCase();
  const filtered = members.filter(
    (m) =>
      m.displayName.toLowerCase().includes(q) ||
      (m.pseudonym?.toLowerCase().includes(q) ?? false),
  );

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Rechercher un membre…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
        aria-label="Rechercher un membre"
      />

      {selectedIds.size > 0 && (
        <p className="font-label text-xs text-on-surface-variant">
          {selectedIds.size} membre{selectedIds.size > 1 ? "s" : ""} sélectionné
          {selectedIds.size > 1 ? "s" : ""}
        </p>
      )}

      {/* Hidden inputs carry selected IDs through form submission */}
      {Array.from(selectedIds).map((id) => (
        <input key={id} type="hidden" name="memberIds" value={id} />
      ))}

      <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-brand border border-outline-variant bg-surface-container-low p-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-outline">Aucun membre trouvé.</p>
        ) : (
          filtered.map((member) => {
            const visibleName = member.pseudonym ?? member.displayName;
            const badge = profileKindLabels[member.profileKind];
            const isSelected = selectedIds.has(member.id);

            return (
              <label
                key={member.id}
                className={`flex cursor-pointer items-center gap-3 rounded px-3 py-2 transition-colors ${
                  isSelected ? "bg-primary/5" : "hover:bg-surface-container"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(member.id)}
                  className="h-4 w-4 accent-primary"
                  aria-label={`Sélectionner ${visibleName}`}
                />
                <span className="flex-1 text-sm text-on-surface">{visibleName}</span>
                <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label text-xs text-on-secondary-container">
                  {badge}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
