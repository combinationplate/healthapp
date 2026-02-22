import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type Cookie = { name: string; value: string; options?: Record<string, unknown> };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Cookie[]) {
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

  // Protect /app routes: redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith("/app") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from login/signup to app
  if (
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/signup") &&
    user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return response;
}
