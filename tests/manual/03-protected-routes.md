# Manual Test 03: Protected Routes and Redirects

## Goal

Confirm that route protection and redirects behave correctly.

## Preconditions

- local app running

## Steps While Signed Out

1. Open `/messages`
2. Open `/parcours`
3. Open `/parametres`

## Expected Results While Signed Out

- each route redirects to `/account`

## Steps While Signed In Without Profile

1. Sign in with a valid account that does not yet have a `profiles` row
2. Open `/messages`

## Expected Results While Signed In Without Profile

- user is redirected to `/account?status=complete-profile`

## Steps While Signed In With Profile

1. Complete profile bootstrap
2. Open `/messages`
3. Open `/parcours`
4. Open `/parametres`
5. Open `/messagerie`

## Expected Results While Signed In With Profile

- protected routes load
- `/messagerie` redirects to `/messages`
