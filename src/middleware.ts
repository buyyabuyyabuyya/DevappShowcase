import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { getCacheControlHeaders } from "@/lib/utils";

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
    "/favicon.png",
    "/sign-in(.*)",
    "/sign-up(.*)"
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
    
    // Add this for Clerk sign-in redirects
    const url = new URL(req.url);
    if (url.pathname.includes('/sign-in') || url.pathname.includes('/sign-up')) {
      // Don't alter Clerk redirects
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      return response;
    }

    
    
    // Create the response
    const response = NextResponse.next();
    
    // Add headers that help with Cloudflare bot protection
    response.headers.set('Permissions-Policy', 'interest-cohort=()');
    
    // Set appropriate cache headers based on route and authentication status
    const isAuthenticated = !!auth.userId;
    const cacheControl = getCacheControlHeaders(req.nextUrl.pathname, isAuthenticated);
    response.headers.set('Cache-Control', cacheControl);
    
    return response;
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};