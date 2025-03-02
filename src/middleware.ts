import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// This example protects all routes including api/trpc routes
export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up",
    "/api/apps(.*)",
    "/api/webhook/clerk",
    "/api/webhooks/stripe",
    "/api/user-status",
    "/_next(.*)",
    "/favicon.ico",
    "/ads.txt",
    "/apps",
    "/apps/(.*)",
    "/api/webhooks/(.*)",
    "/_vercel/speed-insights/(.*)",
    "/cdn-cgi/(.*)",  // Allow Cloudflare paths
  ],
  ignoredRoutes: [
    "/api/webhook/clerk",
    "/api/webhooks/stripe"
  ],
  afterAuth(auth, req) {
    // Add necessary headers for Cloudflare
    const response = NextResponse.next();
    
    // Add headers that help with Cloudflare bot protection
    response.headers.set('Permissions-Policy', 'interest-cohort=()');
    
    return response;
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};