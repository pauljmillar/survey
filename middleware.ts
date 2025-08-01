import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/offers',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/auth/user-role',
])

export default clerkMiddleware((auth, req) => {
  // If user is not authenticated and trying to access protected route
  if (!auth().userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard
  if (auth().userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // If user is authenticated and on home page, redirect to dashboard
  if (auth().userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Handle onboarding flow - new users should complete profile setup
  if (auth().userId && req.nextUrl.pathname === '/dashboard') {
    // We'll let the dashboard component handle checking if profile exists
    // and redirect to onboarding if needed
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
} 