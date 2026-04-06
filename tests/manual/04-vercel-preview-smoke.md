# Manual Test 04: Vercel Preview Smoke Test

## Goal

Confirm that a Vercel preview deployment matches the local auth and route behavior.

## Preconditions

- preview deployment created on Vercel
- preview environment variables configured
- Supabase redirect URL added for the preview domain

## Steps

1. Open the Vercel preview URL
2. Visit `/account`
3. Request a magic link
4. Confirm callback returns to preview domain
5. Complete profile bootstrap if needed
6. Visit `/messages`
7. Visit `/messagerie`

## Expected Results

- preview domain renders correctly
- auth callback succeeds on preview domain
- protected routes enforce the same rules as local
- `/messagerie` still redirects to `/messages`
