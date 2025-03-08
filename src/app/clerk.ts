import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/", "/apps(.*)"],
  afterAuth(auth: any, req: any) {
    // Only redirect to dashboard if coming from auth pages
    if (auth.userId && req.nextUrl.pathname.match(/^\/sign-in|\/sign-up/)) {
      return Response.redirect(new URL('/dashboard', req.url));
    }
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 