import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCacheControlHeaders } from "@/lib/utils";
import { getAuth } from "@clerk/nextjs/server";
export async function middleware(request: NextRequest) {
  // Get the auth state using Clerk's auth helper
  const { userId } = await getAuth(request);
  const isAuthenticated = !!userId;
  
  // Public routes that don't require authentication
  const publicRoutes = [
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
  ];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route.includes('(.*)'))
      return new RegExp(`^${route.replace('(.*)', '.*')}$`).test(request.nextUrl.pathname);
    return route === request.nextUrl.pathname;
  });
  
  // If user is on a verification page and is authenticated, redirect to dashboard
  if (request.nextUrl.pathname.includes('/sign-up/verify') && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  // For sign-in and sign-up pages, don't alter Clerk redirects
  if (request.nextUrl.pathname.includes('/sign-in') || request.nextUrl.pathname.includes('/sign-up')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    return response;
  }
  
  // Create the response
  const response = NextResponse.next();
  
  // Add headers that help with Cloudflare bot protection
  response.headers.set('Permissions-Policy', 'interest-cohort=()');
  
  // Remove any restrictive Content Security Policy headers that might block Clerk resources
  response.headers.delete('Content-Security-Policy');
  
  // Set appropriate cache headers based on route and authentication status
  const cacheControl = getCacheControlHeaders(request.nextUrl.pathname, isAuthenticated);
  response.headers.set('Cache-Control', cacheControl);
  
  return response;
}

// Define the paths that the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/webhooks (webhook API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - favicon.png (favicon file)
     * - apple-touch-icon.png (favicon file)
     * - apple-touch-icon-precomposed.png (favicon file)
     * - public (public files)
     */
    '/((?!api/webhooks|_next/static|_next/image|favicon\.ico|favicon\.png|apple-touch-icon\.png|apple-touch-icon-precomposed\.png|public).*)',
    '/',
  ],
};