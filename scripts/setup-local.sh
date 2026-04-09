set -eu

if [ ! -f ".env.local" ]; then
  cp ".env.example" ".env.local"
  echo "Created .env.local from .env.example"
else
  echo ".env.local already exists"
fi

cat <<'EOF'

Next steps:
1. Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
   Optional but recommended for messaging + notifications:
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_VAPID_PUBLIC_KEY
   - VAPID_PRIVATE_KEY
   - RESEND_API_KEY
   - RESEND_FROM_EMAIL
2. In Supabase Auth settings, add:
   - Site URL: http://localhost:3000
   - Redirect URL: http://localhost:3000/auth/callback
3. Apply these migrations in order:
   - supabase/migrations/0001_initial_foundation.sql
   - supabase/migrations/0002_profile_bootstrap_policies.sql
   - supabase/migrations/0003_live_content_and_messaging.sql
   - supabase/migrations/0004_enable_realtime_messages.sql
   - supabase/migrations/0005_moderation_foundation.sql
   - supabase/migrations/0006_parcours_foundation.sql
   - supabase/migrations/0007_soins_resources.sql
   - supabase/migrations/0008_community.sql
   - supabase/migrations/0009_notifications.sql
   - supabase/migrations/0010_community_reactions.sql
   - supabase/migrations/0011_fix_reaction_rls.sql
   - supabase/migrations/0012_association_messages.sql
   - supabase/migrations/0013_member_open_channels.sql
   - supabase/migrations/0014_admin_collective_messaging.sql
   - supabase/migrations/0015_admin_events_and_registrations.sql
   - supabase/migrations/0016_member_group_conversations.sql
   - supabase/migrations/0017_community_access_by_profile.sql
   - supabase/migrations/0017a_professional_role_enums.sql
   - supabase/migrations/0018_professional_foundation.sql
   - supabase/migrations/0019_professional_agenda.sql
4. Start the app:
   npm run dev
5. Run the local verification pack:
   npm run test:local

Reference docs:
- docs/13-local-testing-and-vercel-setup.md
- tests/README.md
EOF
