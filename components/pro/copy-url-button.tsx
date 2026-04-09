"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silent fail
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "URL copiée" : "Copier l'URL publique"}
      className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
      ) : (
        <Copy aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
      )}
      {copied ? "Copiée" : "Copier"}
    </button>
  );
}
