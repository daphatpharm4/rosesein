# Vercel Deploy Checklist

- Preview and Production environment variables configured in Vercel
- `NEXT_PUBLIC_SITE_URL` matches target domain
- Supabase redirect URLs include preview and production callback URLs
- migrations applied to the correct Supabase project
- `npm run test:local` passes before deployment
- preview smoke test completed
- account flow and profile bootstrap validated on preview
- protected routes validated on preview
