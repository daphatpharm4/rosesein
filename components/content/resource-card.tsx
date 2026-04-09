import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Dumbbell, Newspaper, Play } from "lucide-react";

import type { PublishedResource, ResourceFormat, ResourceDifficulty } from "@/lib/soins";
import { formatDifficulty, formatFormat } from "@/lib/soins";

const FORMAT_ICONS: Record<ResourceFormat, typeof Newspaper> = {
  article: Newspaper,
  video: Play,
  exercise: Dumbbell,
};

const DIFFICULTY_COLOURS: Record<ResourceDifficulty, string> = {
  gentle: "bg-secondary-container text-on-secondary-container",
  moderate: "bg-primary/10 text-primary",
  active: "bg-primary/20 text-primary",
};

type Props = {
  resource: PublishedResource;
};

export function ResourceCard({ resource }: Props) {
  const FormatIcon = FORMAT_ICONS[resource.format];

  return (
    <article className="surface-card space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FormatIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <span
          className={`inline-flex self-start items-center rounded-full px-3 py-1 font-label text-xs font-semibold ${DIFFICULTY_COLOURS[resource.difficulty]}`}
        >
          {formatDifficulty(resource.difficulty)}
        </span>
      </div>

      <div>
        <p className="eyebrow">{formatFormat(resource.format)}</p>
        <h3 className="mt-1 font-headline text-lg font-semibold text-on-surface">
          {resource.title}
        </h3>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">{resource.summary}</p>
      </div>

      <Link
        href={`/soins/${resource.category}/${resource.id}` as Route}
        className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
      >
        Voir le contenu
        <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
      </Link>
    </article>
  );
}
