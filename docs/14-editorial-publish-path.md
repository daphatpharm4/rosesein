# 14. Editorial Publish Path

## Purpose

This note defines how public-facing content moves from draft to publication across the ROSE-SEIN website and application.

## Ownership

- The public website remains the institutional home for mission, donations, partner visibility, and broad public communication.
- The application surfaces only rows that are explicitly published in Supabase.
- Content editors own the article and event records.
- The association validates medical and support content before publication.

## Publish Rule

- Draft content has `published_at = null`.
- Public content has `published_at` set to a timestamp.
- RLS policies expose only rows where `published_at is not null` for `articles` and `events`.
- This means a draft can exist in Supabase without leaking into public app routes.

## Operational Flow

1. Create or update the row in `articles` or `events`.
2. Keep `published_at` empty while content is being reviewed.
3. Validate the final title, summary, timing, and category.
4. Set `published_at` when the item is ready for the public app surfaces.
5. Verify the row appears on `/`, `/actualites`, and `/association`.

## Local Demo Content

For local testing on Mac and Vercel preview smoke checks, use:

- [seed-public-content.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/seed-public-content.sql)

Run it after the canonical schema bootstrap to load a small set of published articles and events.

## Validation Checklist

- Draft rows do not appear on public routes.
- Published articles appear on `/actualites` and the home hero card.
- Published upcoming events appear on `/actualites`, `/association`, and the home event card.
- Content owners know that publication is controlled by `published_at`, not by route code edits.
