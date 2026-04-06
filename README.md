# ROSE-SEIN

ROSE-SEIN is a Next.js foundation for a calm, privacy-first support experience for breast cancer patients, caregivers, and the association team. This repository currently contains the first executable build wave: local app scaffold, editorial design tokens, a messaging route based on the provided Stitch screen, and Supabase-ready project scaffolding.

## Current State

- Framework: Next.js App Router with TypeScript
- Styling: local Tailwind setup with ROSE-SEIN design tokens
- Runtime target: Vercel
- Backend target: Supabase
- Auth state: magic-link sign-in plus profile bootstrap gate for protected routes
- Implemented route:
  - `/`
  - `/account`
- `/actualites`
- `/aide`
- `/association`
- `/messages`
- `/parcours`
  - `/parametres`
  - `/admin/moderation`

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

```bash
cp .env.example .env.local
```

3. Start the dev server:

```bash
npm run dev
```

4. Verify the build:

```bash
npm run test:local
```

## Test On A Phone

For a phone on another network, run the app locally and expose it through a
public tunnel:

```bash
npm run dev:public
cloudflared tunnel --url http://localhost:3000
```

Then open the generated tunnel URL on your phone. For auth to work, add the
tunnel callback URL to Supabase Auth Redirect URLs. The magic-link callback now
uses the incoming request host automatically, so you do not need to keep
`NEXT_PUBLIC_SITE_URL` manually aligned with each preview or tunnel URL.

## Supabase Setup

The repository includes the canonical migration chain through [supabase/migrations/0006_parcours_foundation.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/migrations/0006_parcours_foundation.sql) and canonical helpers under `lib/supabase/`:

- [lib/supabase/client.ts](/Users/charlesvictormahouve/Documents/rosesein/lib/supabase/client.ts)
- [lib/supabase/server.ts](/Users/charlesvictormahouve/Documents/rosesein/lib/supabase/server.ts)
- [lib/supabase/middleware.ts](/Users/charlesvictormahouve/Documents/rosesein/lib/supabase/middleware.ts)

Before connecting the UI to live data, review and apply the migration in your Supabase project, then wire the route loaders and actions to real tables.

## Documentation Set

The repository now includes a full planning and delivery document set:

- [docs/00-executive-summary.md](/Users/charlesvictormahouve/Documents/rosesein/docs/00-executive-summary.md)
- [docs/01-product-architecture.md](/Users/charlesvictormahouve/Documents/rosesein/docs/01-product-architecture.md)
- [docs/02-system-design.md](/Users/charlesvictormahouve/Documents/rosesein/docs/02-system-design.md)
- [docs/03-data-architecture.md](/Users/charlesvictormahouve/Documents/rosesein/docs/03-data-architecture.md)
- [docs/04-cloud-platform.md](/Users/charlesvictormahouve/Documents/rosesein/docs/04-cloud-platform.md)
- [docs/05-cybersecurity-and-privacy.md](/Users/charlesvictormahouve/Documents/rosesein/docs/05-cybersecurity-and-privacy.md)
- [docs/06-analytics-and-reporting.md](/Users/charlesvictormahouve/Documents/rosesein/docs/06-analytics-and-reporting.md)
- [docs/07-marketing-and-content-ops.md](/Users/charlesvictormahouve/Documents/rosesein/docs/07-marketing-and-content-ops.md)
- [docs/08-service-delivery-and-operations.md](/Users/charlesvictormahouve/Documents/rosesein/docs/08-service-delivery-and-operations.md)
- [docs/09-delivery-roadmap.md](/Users/charlesvictormahouve/Documents/rosesein/docs/09-delivery-roadmap.md)
- [docs/10-risk-register.md](/Users/charlesvictormahouve/Documents/rosesein/docs/10-risk-register.md)
- [docs/11-runbooks-and-checklists.md](/Users/charlesvictormahouve/Documents/rosesein/docs/11-runbooks-and-checklists.md)
- [docs/16-moderation-workflow.md](/Users/charlesvictormahouve/Documents/rosesein/docs/16-moderation-workflow.md)
- [docs/13-local-testing-and-vercel-setup.md](/Users/charlesvictormahouve/Documents/rosesein/docs/13-local-testing-and-vercel-setup.md)

The executable workflow package and implementation backlog live under:

- [workflow/README.md](/Users/charlesvictormahouve/Documents/rosesein/workflow/README.md)
- [workflow/final/09-implementation-backlog.md](/Users/charlesvictormahouve/Documents/rosesein/workflow/final/09-implementation-backlog.md)
- [tests/README.md](/Users/charlesvictormahouve/Documents/rosesein/tests/README.md)

## Design Direction

The implementation follows the "Digital Sanctuary" system:

- soft editorial typography
- tonal separation instead of hard borders
- premium gradient emphasis for primary actions
- ambient depth over heavy shadows
- mobile-first navigation with generous spacing

The first screen port intentionally normalizes the Stitch HTML into reusable React components and accessible controls rather than copying raw CDN-based markup.

## Next Waves

- Secure document storage inside Parcours
- Richer moderation tooling beyond the initial reporting queue
- Selective notification delivery integrations
