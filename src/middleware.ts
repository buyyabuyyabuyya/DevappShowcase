import { NextResponse } from "next/server";
import { getCacheControlHeaders } from "@/lib/utils";
import { clerkMiddleware } from "@clerk/nextjs/server";

// Export the middleware
export default clerkMiddleware();

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