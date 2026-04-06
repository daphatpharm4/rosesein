# ROSE-SEIN Local Testing and Vercel Setup

## Purpose

This document is the canonical setup guide for running ROSE-SEIN locally on a Mac and preparing the same application for Vercel deployment.

## Current Deployment Model

ROSE-SEIN is designed to run as:

- Next.js on Vercel
- Supabase for auth, database, and later storage

The recommended local workflow today uses a hosted Supabase project with local Next.js development. That is the fastest and most reliable path for this repo right now.

## Mac Prerequisites

- Node.js 20 or newer
- npm
- a Supabase project
- a Vercel account for preview and production deployment

Optional later:

- Supabase CLI and Docker if you want a fully local database stack

## One-Time Local Setup

From the repo root:

```bash
cd /Users/charlesvictormahouve/Documents/rosesein
npm install
npm run setup:local
```

This creates `.env.local` if it does not already exist.

## Environment Variables

Fill `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do not commit `.env.local`.

## Supabase Auth Configuration

In your Supabase project:

1. Open `Authentication -> URL Configuration`
2. Set `Site URL` to:

```text
http://localhost:3000
```

3. Add this redirect URL:

```text
http://localhost:3000/auth/callback
```

For Vercel later, add:

```text
https://your-production-domain/auth/callback
https://your-preview-domain.vercel.app/auth/callback
```

## Apply Migrations

Apply these SQL files in order in Supabase SQL Editor:

1. [supabase/migrations/0001_initial_foundation.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/migrations/0001_initial_foundation.sql)
2. [supabase/migrations/0002_profile_bootstrap_policies.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/migrations/0002_profile_bootstrap_policies.sql)
3. [supabase/migrations/0003_live_content_and_messaging.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/migrations/0003_live_content_and_messaging.sql)
4. [supabase/migrations/0004_enable_realtime_messages.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/migrations/0004_enable_realtime_messages.sql)
5. [supabase/migrations/0005_moderation_foundation.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/migrations/0005_moderation_foundation.sql)

The second migration is required for the profile bootstrap flow to work without service-role credentials.

If you prefer a single paste-and-run SQL file in Supabase SQL Editor, use:

- [supabase/bootstrap-local.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/bootstrap-local.sql)

## Start the App Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Local Verification Commands

Use this sequence:

```bash
npm run build
npm run typecheck
```

Or use the repo shortcut:

```bash
npm run test:local
```

Important note:

- This repo's `tsconfig.json` includes `.next/types/**/*.ts`
- because of that, `npm run typecheck` should be run after `npm run build`

If `next build` fails with intermittent `.next` cache errors such as `PageNotFoundError` for an existing route, clear generated build artifacts and rerun:

```bash
npm run clean:next
npm run test:local
```

`clean:next` removes only the generated `.next` folder. It does not touch application source files.

## Manual Test Flow

Run the manual cases in [tests/README.md](/Users/charlesvictormahouve/Documents/rosesein/tests/README.md).

At minimum verify:

1. public pages load
2. protected routes redirect while signed out
3. magic-link auth works
4. profile bootstrap works
5. protected routes open only after profile completion
6. `/messagerie` redirects to `/messages`

## Vercel Environment Setup

In Vercel, configure the same variables for:

- Preview
- Production

Required variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

Recommended values:

- Preview:
  - `NEXT_PUBLIC_SITE_URL=https://your-project-git-branch.vercel.app`
- Production:
  - `NEXT_PUBLIC_SITE_URL=https://your-domain`

## Vercel Deployment Checklist

Before deploying:

1. ensure migrations have been applied to the correct Supabase project
2. ensure Vercel environment variables are present
3. ensure Supabase redirect URLs include the correct Vercel callback URLs
4. run:

```bash
npm run test:local
```

5. verify account auth and profile bootstrap on a preview deployment before production promotion

## Recommended Environment Strategy

### Local

- local Next.js app
- non-production Supabase project

### Preview

- Vercel preview deployment
- same non-production Supabase project or a dedicated staging project

### Production

- Vercel production deployment
- dedicated production Supabase project

## Optional Future Supabase CLI Setup

If you later want a fully local database stack, add Supabase CLI and Docker and introduce:

- `supabase/config.toml`
- local database reset or push workflow
- seed scripts

Do not add that workflow until you are ready to maintain local database parity with the hosted project.
