import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/panels',
  '/api/offers',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/auth/user-role',
])

export default clerkMiddleware(async (auth, req) => {
  // Get user ID from auth
  const { userId } = await auth()
  
  // Check if this is an admin route that requires authentication
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  
  // If user is not authenticated and trying to access protected route
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // If user is not authenticated and trying to access admin routes
  if (!userId && isAdminRoute) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard
  if (userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // If user is authenticated and on home page, redirect to dashboard
  if (userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Handle onboarding flow - new users should complete profile setup
  if (userId && req.nextUrl.pathname === '/dashboard') {
    // We'll let the dashboard component handle checking if profile exists
    // and redirect to onboarding if needed
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
} 