# Manual Test 01: Public Pages

## Goal

Confirm that public-facing pages render correctly without authentication.

## Preconditions

- app running locally with `npm run dev`

## Steps

1. Open `http://localhost:3000`
2. Open `http://localhost:3000/actualites`
3. Open `http://localhost:3000/association`
4. Open `http://localhost:3000/account`

## Expected Results

- each route loads without a server error
- shell layout is intact
- no protected data is shown
- account page shows sign-in form if signed out
