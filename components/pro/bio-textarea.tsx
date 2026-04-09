"use client";

import { useState } from "react";

const MAX_BIO = 600;

export function BioTextarea({ defaultValue }: { defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const remaining = MAX_BIO - value.length;

  return (
    <div className="space-y-1.5">
      <textarea
        name="bio"
        rows={5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_BIO}
        className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm leading-7 text-on-surface motion-field"
      />
      <p
        className={`text-right text-xs tabular-nums ${
          remaining < 60 ? "text-primary" : "text-on-surface-variant"
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        {remaining} caractère{remaining !== 1 ? "s" : ""} restant{remaining !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
