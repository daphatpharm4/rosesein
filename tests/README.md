# ROSE-SEIN Tests

This folder contains the local testing and release verification package for ROSE-SEIN.

## Structure

- `manual/`: step-by-step human test cases
- `checklists/`: pre-release and deployment checklists

## Recommended Order

1. Follow [docs/13-local-testing-and-vercel-setup.md](/Users/charlesvictormahouve/Documents/rosesein/docs/13-local-testing-and-vercel-setup.md)
2. Run:

```bash
npm run test:local
```

3. Execute manual tests in this order:
   - `manual/01-public-pages.md`
   - `manual/02-auth-and-profile-bootstrap.md`
   - `manual/03-protected-routes.md`
   - `manual/04-vercel-preview-smoke.md`
   - `manual/05-settings-and-moderation.md`

If local verification fails with an intermittent Next cache or route artifact error, run:

```bash
npm run clean:next
npm run test:local
```

## Current Test Scope

This repo currently supports:

- build verification
- typecheck verification
- manual smoke testing
- manual auth and routing validation

It does not yet include automated browser or integration tests.

## Recommended Next Testing Wave

- Playwright smoke tests for auth and redirects
- server-side integration tests for Supabase-backed loaders and actions
- release smoke tests against Vercel preview URLs
