import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routing:
 *   /           → landing page (public)
 *   /login      → login page (public; redirect to /app if already authenticated)
 *   /signup     → signup page (public; redirect to /app if already authenticated)
 *   /app        → dashboard (protected; redirect to /login if not authenticated)
 *   /dashboard  → redirect to /app
 *   Any other protected path: redirect to /login with redirect param
 */

type Cookie = { name: string; value: string; options?: Record<string, unknown> };

const LOGIN_PATH = "/login";
const APP_PATH = "/app";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // /dashboard → /app (consolidate)
  if (pathname === "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = APP_PATH;
    return NextResponse.redirect(url);
  }

  // Protected routes: /app and anything under it → /login if not authenticated
  if (pathname === APP_PATH || pathname.startsWith(APP_PATH + "/")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Logged-in users visiting login or signup → /app
  if ((pathname === LOGIN_PATH || pathname === "/signup") && user) {
    const url = request.nextUrl.clone();
    url.pathname = APP_PATH;
    return NextResponse.redirect(url);
  }

  return response;
}
