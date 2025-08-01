'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { Pricing } from '@/components/pricing'
import { Footer } from '@/components/footer'
import { LandingPageHeader } from '@/components/landing-page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <LandingPageHeader />
      
      <main>
        <SignedOut>
          {/* Hero Section with Registration CTA */}
          <section className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="sm:text-center lg:text-left pt-8 sm:pt-12 lg:pt-16">
                    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                      <span className="block xl:inline">Earn Points for Your</span>{' '}
                      <span className="block text-blue-600 xl:inline">Opinions</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      Join thousands of panelists earning points by completing surveys. 
                      Share your thoughts and redeem rewards from top merchants.
                    </p>
                    
                    {/* Registration Cards */}
                    <div className="mt-8 sm:mt-12">
                      <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto lg:mx-0">
                        {/* Sign Up Card */}
                        <Card className="p-6 bg-white/90 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-200">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">New Panelist</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Create your account and start earning points immediately
                            </p>
                            <SignUpButton mode="modal">
                              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                Sign Up Free
                              </Button>
                            </SignUpButton>
                          </div>
                        </Card>

                        {/* Sign In Card */}
                        <Card className="p-6 bg-white/90 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-200">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Returning Panelist</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Welcome back! Access your dashboard and available surveys
                            </p>
                            <SignInButton mode="modal">
                              <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                                Sign In
                              </Button>
                            </SignInButton>
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-8 sm:mt-12">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">10K+</div>
                          <div className="text-sm text-gray-600">Active Panelists</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">50+</div>
                          <div className="text-sm text-gray-600">Survey Partners</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">$2M+</div>
                          <div className="text-sm text-gray-600">Rewards Earned</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hero Image */}
              <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
                <div className="h-56 w-full bg-gradient-to-r from-blue-400 to-purple-500 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-xl font-semibold">Your Voice Matters</div>
                    <div className="text-sm opacity-90">Help shape products and services</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <Features />
          
          {/* Pricing/Benefits Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  How It Works
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Start earning points in three simple steps
                </p>
              </div>
              
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Up</h3>
                  <p className="text-gray-600">
                    Create your free account and complete your profile to get matched with relevant surveys
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Surveys</h3>
                  <p className="text-gray-600">
                    Share your opinions on topics you care about. Each survey takes 5-15 minutes
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Earn Rewards</h3>
                  <p className="text-gray-600">
                    Redeem your points for gift cards, cashback, and exclusive offers from top brands
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Final CTA Section */}
          <section className="py-16 bg-blue-600">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to Start Earning?
              </h2>
              <p className="mt-4 text-xl text-blue-100">
                Join our community of panelists and turn your opinions into rewards
              </p>
              <div className="mt-8">
                <SignUpButton mode="modal">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 font-semibold px-8 py-3">
                    Get Started Today
                  </Button>
                </SignUpButton>
              </div>
              <p className="mt-4 text-sm text-blue-200">
                Free to join • No credit card required • Instant approval
              </p>
            </div>
          </section>
        </SignedOut>

        <SignedIn>
          {/* Redirect authenticated users - this shouldn't show due to useEffect redirect */}
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome back!</h1>
              <p className="text-gray-600 mb-4">Redirecting you to your dashboard...</p>
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </SignedIn>
      </main>

      <Footer />
    </div>
  )
}
