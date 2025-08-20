import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)', // Everything except static files and _next
    '/',
    '/(api|trpc)(.*)',             // API & tRPC routes
  ],
}
