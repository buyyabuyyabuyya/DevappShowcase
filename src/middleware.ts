import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// This example protects all routes including api/trpc routes
export default authMiddleware({
  publicRoutes: [
    "/",
    "/apps",
    "/apps/(.*)",
    "/api/webhooks/(.*)",
    "/api/user-status",
    "/_vercel/speed-insights/(.*)",
    "/cdn-cgi/(.*)",
    "/favicon.ico",
    "/favicon.png"
  ],
  ignoredRoutes: [
    "/api/webhook/clerk",
    "/api/webhooks/stripe"
  ],
  afterAuth(auth, req) {
    // If user is on a verification page and is authenticated, redirect to dashboard
    if (req.nextUrl.pathname.includes('/sign-up/verify') && auth.userId) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
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