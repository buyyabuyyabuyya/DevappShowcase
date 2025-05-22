import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { getCacheControlHeaders } from "@/lib/utils";

// Define Clerk-related domains to ensure they're allowed in CSP
const clerkDomains = [
  'clerk.devappshowcase.com',
  'img.clerk.com',
  'images.clerk.dev'
];

// This example protects all routes including api/trpc routes
// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
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
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
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
    
    // For sign-in and sign-up pages, don't alter Clerk redirects
    const url = new URL(req.url);
    if (url.pathname.includes('/sign-in') || url.pathname.includes('/sign-up')) {
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      return response;
    }
    
    // Create the response
    const response = NextResponse.next();
    
    // Add headers that help with Cloudflare bot protection but ensure Clerk domains are allowed
    response.headers.set('Permissions-Policy', 'interest-cohort=()');
    
    // Allow Clerk to load images and resources by ensuring there's no restrictive CSP
    // that would block these resources
    response.headers.delete('Content-Security-Policy');
    
    // Set appropriate cache headers based on route and authentication status
    const isAuthenticated = !!auth.userId;
    const cacheControl = getCacheControlHeaders(req.nextUrl.pathname, isAuthenticated);
    response.headers.set('Cache-Control', cacheControl);
    
    return response;
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/',
  ],
};