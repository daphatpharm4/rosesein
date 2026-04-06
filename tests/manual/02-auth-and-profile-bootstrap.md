# Manual Test 02: Auth and Profile Bootstrap

## Goal

Confirm that magic-link auth and the profile bootstrap flow work end to end.

## Preconditions

- `.env.local` configured
- Supabase Auth redirect URL set to `http://localhost:3000/auth/callback`
- both migrations applied

## Steps

1. Open `http://localhost:3000/account`
2. Enter a valid email
3. Request a magic link
4. Open the link from your email
5. Confirm you return to the account flow
6. Complete:
   - profile kind
   - display name
   - optional pseudonym
   - anonymity preference
7. Submit the form
8. Continue into `/messages`

## Expected Results

- auth callback succeeds
- user without profile is forced through profile setup
- profile save succeeds without a server error
- user can continue into protected routes after setup
