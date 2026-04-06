import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseBrowserEnv } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPrefixes = ["/communaute", "/messages", "/parcours", "/parametres", "/admin"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!hasSupabaseBrowserEnv()) {
    if (isProtectedPath(pathname)) {
      const redirectUrl = new URL("/account", request.url);
      redirectUrl.searchParams.set("error", "missing-supabase-env");
      redirectUrl.searchParams.set("redirectTo", `${pathname}${search}`);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  const { response, user, supabase } = await updateSession(request);

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = new URL("/account", request.url);
    redirectUrl.searchParams.set("status", "signin-required");
    redirectUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (isProtectedPath(pathname) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      const redirectUrl = new URL("/account", request.url);
      redirectUrl.searchParams.set("status", "complete-profile");
      redirectUrl.searchParams.set("redirectTo", `${pathname}${search}`);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
