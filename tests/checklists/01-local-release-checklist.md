# Local Release Checklist

- dependencies installed
- `.env.local` configured
- Supabase redirect URLs configured
- `0001_initial_foundation.sql` applied
- `0002_profile_bootstrap_policies.sql` applied
- `npm run test:local` passes
- if build cache errors occur, `npm run clean:next` then rerun `npm run test:local`
- manual tests `01` through `03` completed
