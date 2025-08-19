import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware(async (auth, req) => {
  // Get user ID from auth
  const { userId } = await auth()
  
  const pathname = req.nextUrl.pathname
  
  // Check if this is an admin route that requires authentication
  const isAdminRoute = pathname.startsWith('/admin')
  
  // Explicitly define public routes
  const isPublicPath = pathname === '/' || 
                      pathname === '/panels' ||
                      pathname.startsWith('/sign-in') ||
                      pathname.startsWith('/sign-up') ||
                      pathname.startsWith('/api/offers') ||
                      pathname.startsWith('/api/auth/user-role')
  
  // If user is not authenticated and trying to access admin routes
  if (!userId && isAdminRoute) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // If user is not authenticated and trying to access protected route (but not public routes)
  if (!userId && !isPublicPath) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard
  if (userId && (pathname === '/sign-in' || pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // If user is authenticated and on home page, redirect to dashboard
  if (userId && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Handle onboarding flow - new users should complete profile setup
  if (userId && pathname === '/dashboard') {
    // We'll let the dashboard component handle checking if profile exists
    // and redirect to onboarding if needed
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
} 