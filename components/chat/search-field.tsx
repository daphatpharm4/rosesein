import { Search } from "lucide-react";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="conversation-search"
        className="type-meta text-on-surface-variant"
      >
        Rechercher une discussion
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
          strokeWidth={1.8}
        />
        <input
          id="conversation-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nom, groupe ou atelier"
          className="w-full rounded-brand bg-surface-container-high px-12 py-4 text-base text-on-surface placeholder:text-outline"
        />
      </div>
    </div>
  );
}
