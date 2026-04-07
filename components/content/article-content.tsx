import type { ArticleBlock } from "@/lib/content";

type Props = {
  blocks: ArticleBlock[];
};

export function ArticleContent({ blocks }: Props) {
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className="text-base leading-8 text-on-surface-variant">
              {block.text}
            </p>
          );
        }

        if (block.type === "heading") {
          return (
            <h2 key={index} className="font-headline text-xl font-bold text-on-surface mt-8 mb-3">
              {block.text}
            </h2>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-primary pl-5 py-1 text-base leading-8 text-on-surface-variant italic"
            >
              {block.text}
            </blockquote>
          );
        }

        if (block.type === "image") {
          return (
            <figure
              key={index}
              className="overflow-hidden rounded-brand-md bg-surface-container-low"
            >
              <img
                src={block.src}
                alt={block.alt || ""}
                aria-hidden={block.alt ? undefined : true}
                loading={index === 0 ? undefined : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
                width={1200}
                height={675}
                className="h-auto w-full object-cover"
                style={{ aspectRatio: "16 / 9" }}
              />
            </figure>
          );
        }

        return null;
      })}
    </div>
  );
}
