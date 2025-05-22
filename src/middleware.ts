import { NextResponse, NextRequest, NextFetchEvent } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const clerk = clerkMiddleware(); // get Clerk's middleware instance

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Run Clerk's middleware
  const response = await clerk(request, event);

  // If Clerk returned a response (e.g., redirect), return it as-is
  if (!response) return NextResponse.next();

  // Clean up CSP headers to fix Clerk script issues
  response.headers.delete("Content-Security-Policy");

  // Add any additional headers
  response.headers.set("Permissions-Policy", "interest-cohort=()");

  return response;
}

export const config = {
  matcher: [
    '/((?!api/webhooks|_next/static|_next/image|favicon\\.ico|favicon\\.png|apple-touch-icon\\.png|apple-touch-icon-precomposed\\.png|public).*)',
    '/',
  ],
};
