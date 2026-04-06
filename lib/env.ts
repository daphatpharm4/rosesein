function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseBrowserEnv() {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  };
}

export function hasSupabaseBrowserEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function getSupabaseServiceRoleKey() {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getOptionalEnv(name: string) {
  return process.env[name] ?? null;
}

export function getPushVapidPublicKey() {
  return getOptionalEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
}

export function getPushVapidPrivateKey() {
  return getOptionalEnv("VAPID_PRIVATE_KEY");
}

export function getResendApiKey() {
  return getOptionalEnv("RESEND_API_KEY");
}

export function getResendFromEmail() {
  return getOptionalEnv("RESEND_FROM_EMAIL");
}
