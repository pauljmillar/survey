import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/", 
  "/panels", 
  "/sign-in(.*)", 
  "/sign-up(.*)", 
  "/api/offers(.*)", 
  "/api/auth/user-role(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // ✅ Early return for public routes (don’t hit Clerk at all)
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protected route check
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on all routes except static files and _next
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
