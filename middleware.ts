import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PREFIXES = ["/app", "/login", "/signup", "/dashboard"];

export async function middleware(request: NextRequest) {
  // Canonical host: permanently redirect www → non-www.
  const host = request.headers.get("host") || "";
  if (host.toLowerCase().startsWith("www.")) {
    const url = new URL(request.url);
    url.hostname = url.hostname.replace(/^www\./i, "");
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url.toString(), 301);
  }

  // Only run the Supabase session refresh on auth-relevant paths.
  const path = request.nextUrl.pathname;
  if (AUTH_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return await updateSession(request);
  }
  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next internals and static files (so the host
  // redirect applies sitewide), but the body above scopes the auth work.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
