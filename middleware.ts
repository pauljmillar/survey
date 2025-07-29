import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
  ],
  
  // Routes that require authentication
  ignoredRoutes: [
    '/api/webhooks(.*)',
  ],

  // After auth middleware runs
  afterAuth(auth, req, evt) {
    // Handle unauthenticated users
    if (!auth.userId && !auth.isPublicRoute) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    // Handle authenticated users accessing auth pages
    if (auth.userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Role-based route protection
    if (auth.userId) {
      const { pathname } = req.nextUrl

      // System admin only routes
      if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/survey')) {
        // Will be checked by AuthGuard component
      }

      // Survey admin routes
      if (pathname.startsWith('/admin/survey') || pathname.startsWith('/surveys/manage')) {
        // Will be checked by AuthGuard component
      }

      // Panelist only routes
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/surveys/available') || pathname.startsWith('/redemptions')) {
        // Will be checked by AuthGuard component
      }
    }

    return NextResponse.next()
  },
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
} 