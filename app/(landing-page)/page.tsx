'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'

import { Footer } from '@/components/footer'
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
    <div className="min-h-screen bg-background">
      
      <main>
        <SignedOut>
          {/* Hero Section with Registration CTA */}
          <section className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="sm:text-center lg:text-left pt-8 sm:pt-12 lg:pt-16">
                    <h1 className="text-4xl tracking-tight font-extrabold text-foreground sm:text-5xl md:text-6xl">
                      <span className="block xl:inline">Earn Points for Your</span>{' '}
                      <span className="block text-foreground xl:inline">Opinions</span>
                    </h1>
                    <p className="mt-3 text-base text-muted-foreground sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      Join thousands of panelists earning points by completing surveys. 
                      Share your thoughts and redeem rewards from top merchants.
                    </p>
                    
                    {/* Registration Cards */}
                    <div className="mt-8 sm:mt-12">
                      <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto lg:mx-0">
                        {/* Sign Up Card */}
                        <Card className="p-6 bg-card border-border hover:shadow-lg transition-all duration-200">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">New Panelist</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Create your account and start earning points immediately
                            </p>
                            <SignUpButton mode="modal">
                              <Button className="w-full bg-background hover:bg-muted text-foreground">
                                Sign Up Free
                              </Button>
                            </SignUpButton>
                          </div>
                        </Card>

                        {/* Sign In Card */}
                        <Card className="p-6 bg-card border-border hover:shadow-lg transition-all duration-200">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Returning Panelist</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Welcome back! Access your dashboard and available surveys
                            </p>
                            <SignInButton mode="modal">
                              <Button variant="outline" className="w-full border-border hover:bg-muted">
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
                          <div className="text-2xl font-bold text-foreground">10K+</div>
                          <div className="text-sm text-muted-foreground">Active Panelists</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-foreground">50+</div>
                          <div className="text-sm text-muted-foreground">Survey Partners</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-foreground">$2M+</div>
                          <div className="text-sm text-muted-foreground">Rewards Earned</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hero Image */}
              <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
                <div className="h-56 w-full bg-muted sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
                  <div className="text-center text-foreground">
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
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  How It Works
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Start earning points in three simple steps
                </p>
              </div>
              
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-foreground">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Sign Up</h3>
                  <p className="text-muted-foreground">
                    Create your free account and complete your profile to get matched with relevant surveys
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-foreground">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Complete Surveys</h3>
                  <p className="text-muted-foreground">
                    Share your opinions on topics you care about. Each survey takes 5-15 minutes
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-foreground">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Earn Rewards</h3>
                  <p className="text-muted-foreground">
                    Redeem your points for gift cards, cashback, and exclusive offers from top brands
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Final CTA Section */}
          <section className="py-16 bg-background">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                Ready to Start Earning?
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Join our community of panelists and turn your opinions into rewards
              </p>
              <div className="mt-8">
                <SignUpButton mode="modal">
                  <Button size="lg" className="bg-foreground text-background hover:bg-muted font-semibold px-8 py-3">
                    Get Started Today
                  </Button>
                </SignUpButton>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Free to join • No credit card required • Instant approval
              </p>
            </div>
          </section>
        </SignedOut>

        <SignedIn>
          {/* Redirect authenticated users - this shouldn't show due to useEffect redirect */}
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Welcome back!</h1>
              <p className="text-muted-foreground mb-4">Redirecting you to your dashboard...</p>
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </SignedIn>
      </main>

      <Footer 
        builtBy="Your Company"
        builtByLink="https://example.com"
        githubLink="https://github.com"
        twitterLink="https://twitter.com"
        linkedinLink="https://linkedin.com"
      />
    </div>
  )
}
