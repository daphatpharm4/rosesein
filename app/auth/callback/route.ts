import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeNext(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/messages";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = normalizeNext(searchParams.get("next"));

  if (!hasSupabaseBrowserEnv()) {
    return NextResponse.redirect(new URL("/account?error=missing-supabase-env", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/account?error=missing-auth-code", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/account?error=callback-failed", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
