import { createClient } from "@supabase/supabase-js";

import { getSupabaseBrowserEnv } from "@/lib/env";

export function createSupabasePublicClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
