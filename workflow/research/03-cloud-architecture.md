# 03. Cloud Architecture

## Target Topology

ROSE-SEIN should remain on a simple cloud stack:

- Next.js App Router on Vercel
- Supabase Auth for authentication
- Supabase Postgres for primary application data
- Supabase Storage for future private document storage

This is sufficient for MVP and keeps platform risk lower than introducing extra infrastructure layers.

## Environment Strategy

| Environment | App hosting | Data project | Purpose |
| --- | --- | --- | --- |
| Local | local Next.js | local or shared non-prod Supabase | developer iteration |
| Preview | Vercel preview | shared non-prod Supabase | branch validation |
| Production | Vercel production | dedicated production Supabase | live users |

Recommended minimum: one non-production Supabase project and one production Supabase project.

## Runtime Architecture

- Middleware refreshes auth state before protected route access.
- Server components should own protected reads.
- Server actions or route handlers should own sensitive writes.
- Client components should only handle interaction, local state, and rendering.

## Data and Storage Model

### Postgres

Use for:

- profiles and roles
- articles and events
- thread and message metadata
- notification preferences
- future moderation and audit tables

### Storage

Use private buckets only for:

- prescriptions
- results
- journey attachments
- explicit private uploads

No public bucket should ever contain user-sensitive documents.

## Connectivity Strategy

MVP should be low-connectivity friendly, not fully offline-first.

- keep pages lightweight
- favor server-rendered first paint
- allow draft composition states on the client
- defer full offline sync architecture until there is evidence it is needed

## Cost and Reliability Tradeoffs

| Decision | Recommended choice | Why |
| --- | --- | --- |
| Hosting | Vercel managed | fast iteration, preview deploys, simple rollback |
| Database | Supabase Postgres | already aligned with auth and RLS model |
| Realtime | defer by default | not required for first usable messaging wave |
| File handling | private storage only | trust and privacy requirement |
| Multi-region complexity | defer | MVP does not justify added operational load |

## Failure Domains

- Vercel deploy regression
- Supabase auth outage
- migration failure
- storage misconfiguration
- missing or incorrect environment variables

## Cloud Controls Required Before Production

1. documented production and non-production environment variables
2. reversible or explicitly reviewed migrations
3. pre-release checklist for auth, routes, and RLS-sensitive changes
4. storage policy review before any document feature
5. incident owner and rollback owner on each release

## Recommendation

Do not broaden the architecture. The right move is to finish a disciplined Vercel plus Supabase operating model, not to add more services.
