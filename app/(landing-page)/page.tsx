'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'

import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center pt-48 pb-16">
                <h1 className="text-4xl tracking-tight font-extrabold text-foreground sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Earn rewards by sharing</span>{' '}
                  <span className="block text-foreground xl:inline">your opinions</span>
                </h1>
                <p className="mt-6 text-base text-muted-foreground sm:mt-8 sm:text-lg sm:max-w-2xl sm:mx-auto md:mt-8 md:text-xl">
                  Complete surveys and get paid—no hassle, just honest feedback.
                </p>
                
                {/* Registration Cards */}
                <div className="mt-12 sm:mt-16">
                  <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
                    {/* Sign Up Card */}
                    <Card className="p-6 bg-card border-border hover:shadow-lg transition-all duration-200">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Join Now</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get 100-point bonus for getting started
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
                        <h3 className="text-lg font-semibold text-foreground mb-2">Welcome Back</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Access your dashboard and available surveys
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
                <div className="mt-12 sm:mt-16">
                  <div className="grid grid-cols-3 gap-4 text-center max-w-md mx-auto">
                    <div>
                      <div className="text-2xl font-bold text-foreground">3M+</div>
                      <div className="text-sm text-muted-foreground">Active Members</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">$70M+</div>
                      <div className="text-sm text-muted-foreground">Distributed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">4.5★</div>
                      <div className="text-sm text-muted-foreground">User Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  How It Works
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Start earning in three simple steps
                </p>
              </div>
              
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-foreground">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Set Up Your Profile</h3>
                  <p className="text-muted-foreground">
                    Sign up and fill in your demographic details. Your profile helps match you with survey opportunities that suit you.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-foreground">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Answer Surveys</h3>
                  <p className="text-muted-foreground">
                    Earn points by completing short and longer surveys. Typical surveys reward between 50 and 500 points depending on length.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-foreground">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Exchange Points for Cash or Gift Cards</h3>
                  <p className="text-muted-foreground">
                    Once you've reached at least 500 points ($5 equivalent), you can cash out. Choose from PayPal, direct bank transfer, or gift cards from hundreds of brands.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* More Ways to Earn Section */}
          <section className="py-16 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  More Ways to Earn
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Maximize your rewards with these additional opportunities
                </p>
              </div>
              
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <Card className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Daily Polls & Loyalty Bonuses</h3>
                    <p className="text-muted-foreground">
                      Earn small points by answering daily questions. Weekly bonuses available for consistent activity through the loyalty program.
                    </p>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Refer Friends for Bonus Points</h3>
                    <p className="text-muted-foreground">
                      Invite friends and earn extra rewards when they participate. Top-tier users can receive up to 500 points per referral.
                    </p>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Progress Through Loyalty Tiers</h3>
                    <p className="text-muted-foreground">
                      Earn more by leveling up: Bronze → Silver (600 pts/month) → Gold (2,100 pts/month). Higher levels receive faster payouts and extra point bonuses.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* Why Join Section */}
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  Why Join?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Join millions of satisfied members worldwide
                </p>
              </div>
              
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Millions of Members Worldwide</h3>
                  <p className="text-muted-foreground">
                    A trusted platform with over 3 million active users
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Over $70 Million Distributed</h3>
                  <p className="text-muted-foreground">
                    Members have collectively earned more than $72 million
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Highly Rated by Real Users</h3>
                  <p className="text-muted-foreground">
                    Reviewed by thousands of participants with an average rating above 4 stars
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 bg-muted/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  Common Questions
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Everything you need to know about earning rewards
                </p>
              </div>
              
              <div className="mt-12 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">What is this platform about?</h3>
                  <p className="text-muted-foreground">
                    It's a free service that allows users to earn rewards in exchange for participating in market research surveys.
                  </p>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">How often can I take surveys?</h3>
                  <p className="text-muted-foreground">
                    There's no cap—new surveys become available regularly depending on your profile.
                  </p>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">When do I receive my rewards?</h3>
                  <p className="text-muted-foreground">
                    After completing surveys and reaching the payout minimum, your reward is typically processed within 1–2 business days and sent out shortly after.
                  </p>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Who can join?</h3>
                  <p className="text-muted-foreground">
                    Membership is currently open to residents of the U.S., Canada, and the U.K.
                  </p>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">What are points worth?</h3>
                  <p className="text-muted-foreground">
                    100 points = $1. You need at least 500 points to request a payout.
                  </p>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">How can I increase my chances of getting matched to surveys?</h3>
                  <p className="text-muted-foreground">
                    Keep your profile updated so the system can better align you with available research opportunities.
                  </p>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Why do some surveys end abruptly?</h3>
                  <p className="text-muted-foreground">
                    Some surveys close once enough responses are collected or if your profile doesn't match their specific criteria.
                  </p>
                </Card>
              </div>
            </div>
          </section>

          {/* Summary Table Section */}
          <section className="py-16 bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  Program Summary
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Key details at a glance
                </p>
              </div>
              
              <div className="mt-12">
                <Card className="p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Welcome Bonus</span>
                        <span className="font-semibold">100 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payout Threshold</span>
                        <span className="font-semibold">500 points ($5)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processing Time</span>
                        <span className="font-semibold">1-2 business days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Availability</span>
                        <span className="font-semibold">US, Canada, UK</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Redemption Options</span>
                        <span className="font-semibold">PayPal, Bank, Gift Cards</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loyalty Rewards</span>
                        <span className="font-semibold">Bronze → Silver → Gold</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Extra Opportunities</span>
                        <span className="font-semibold">Referrals, Daily Polls</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reputation</span>
                        <span className="font-semibold">3M+ members, $70M+ paid</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>
          
          {/* Final CTA Section */}
          <section className="py-16 bg-muted/30">
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
                Free to join • No credit card required • Instant approval • 100-point welcome bonus
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


    </div>
  )
}
