import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Clerk will handle skipping auth for these routes automatically
export default clerkMiddleware({
  publicRoutes: [
    '/',                // Home page
    '/panels',          // Public panels route
    '/sign-in(.*)',     // Sign-in page + subroutes
    '/sign-up(.*)',     // Sign-up page + subroutes
    '/api/offers(.*)',  // Public API route(s)
    '/api/auth/user-role(.*)', // Public API route(s)
  ],
})

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)', // Everything except static files and _next
    '/',
    '/(api|trpc)(.*)',             // API & tRPC routes
  ],
}
