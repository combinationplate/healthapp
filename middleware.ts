import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Only run middleware on routes that need auth:
     * /app, /login, /signup, /dashboard
     * Skip everything else (blog, landing, accreditation, api, static files)
     */
    "/app/:path*",
    "/login",
    "/signup",
    "/dashboard",
  ],
};

