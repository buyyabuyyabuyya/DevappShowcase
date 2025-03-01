import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up",
    "/api/apps(.*)",
    "/api/webhook/clerk",
    "/_next(.*)",
    "/favicon.ico",
    "/ads.txt",
  ],
  ignoredRoutes: [
    "/api/webhook/clerk"
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};