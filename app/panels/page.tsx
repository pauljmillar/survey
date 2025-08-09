'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PanelsLandingPage() {
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
                  <span className="block xl:inline">Get paid for your</span>{' '}
                  <span className="block text-foreground xl:inline">junk mail</span>
                </h1>
                <p className="mt-6 text-base text-muted-foreground sm:mt-8 sm:text-lg sm:max-w-2xl sm:mx-auto md:mt-8 md:text-xl">
                  Earn between $5 and $15 per week by taking photos of the promotional material you receive in the mail.
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
                        <h3 className="text-lg font-semibold text-foreground mb-2">Join the Panel</h3>
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
                          Access your dashboard and panel activities
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
                      <div className="text-2xl font-bold text-foreground">2M+</div>
                      <div className="text-sm text-muted-foreground">Panel Members</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">$45M+</div>
                      <div className="text-sm text-muted-foreground">Distributed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">4.7★</div>
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
                  Start earning weekly in three simple steps
                </p>
              </div>
              
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-foreground">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Set Up Your Profile</h3>
                  <p className="text-muted-foreground">
                    Sign up and provide your mailing address. Your profile helps us track your participation and ensure you receive proper credit.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-foreground">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Take Photos of Your Mail</h3>
                  <p className="text-muted-foreground">
                    Use our app to take photos of the promotional material you are sent in the mail. You can do this daily or save it up until the end of the week - as long as it happens, you earn points every week.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-foreground">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Get Paid Weekly</h3>
                  <p className="text-muted-foreground">
                    Earn between $5 and $15 per week just for photographing your junk mail. Cash out via PayPal, direct bank transfer, or gift cards from hundreds of brands.
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Daily Mail Photos</h3>
                    <p className="text-muted-foreground">
                      Upload photos of promotional mail as it arrives. Consistent daily uploads earn bonus points on top of your weekly earnings.
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
                    <h3 className="text-lg font-semibold text-foreground mb-2">Refer Friends to the Panel</h3>
                    <p className="text-muted-foreground">
                      Invite friends to join the mail panel and earn extra rewards when they participate. Top-tier members can receive up to 500 points per referral.
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
                    <h3 className="text-lg font-semibold text-foreground mb-2">Progress Through Panel Tiers</h3>
                    <p className="text-muted-foreground">
                      Earn more by leveling up: Bronze → Silver → Gold panels. Higher levels receive bigger weekly payouts and faster processing.
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
                  Why Join Our Mail Panel?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Join millions of satisfied panel members worldwide
                </p>
              </div>
              
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Millions of Panel Members Worldwide</h3>
                  <p className="text-muted-foreground">
                    A trusted platform with over 2 million active mail panel participants
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Weekly Guaranteed Payments</h3>
                  <p className="text-muted-foreground">
                    Earn $5-$15 every week just by photographing your mail. No minimum threshold, no waiting periods.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Privacy & Security</h3>
                  <p className="text-muted-foreground">
                    Your personal information is protected. We only track promotional mail content, never personal mail.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonial Section */}
          <section className="py-16 bg-muted/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  What Panel Members Say
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Real stories from our mail panel community
                </p>
              </div>
              
              <div className="mt-12 grid gap-8 md:grid-cols-2">
                <Card className="p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-muted-foreground">
                        &quot;I&apos;ve been in the mail panel for 6 months and earn about $12 every week just by taking photos of my junk mail. It&apos;s literally the easiest money I&apos;ve ever made!&quot;
                      </p>
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-foreground">Sarah M.</p>
                        <p className="text-sm text-muted-foreground">Panel Member since 2023</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-muted-foreground">
                        &quot;The app is so simple to use. I just take a quick photo when I get home from checking the mail. My wife thinks I&apos;m crazy but I&apos;ve made over $400 this year!&quot;
                      </p>
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-foreground">Mike T.</p>
                        <p className="text-sm text-muted-foreground">Gold Panel Member</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  Frequently Asked Questions
                </h2>
              </div>
              
              <div className="mt-12 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">What kind of mail should I photograph?</h3>
                  <p className="text-muted-foreground">
                    Any promotional material, advertisements, catalogs, or marketing mail. Do not photograph personal mail, bills, or sensitive documents.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">How often do I need to upload photos?</h3>
                  <p className="text-muted-foreground">
                    You can upload daily or save it up until the end of the week. As long as you participate each week, you&apos;ll earn your weekly payment.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">When do I get paid?</h3>
                  <p className="text-muted-foreground">
                    Payments are processed every Friday for the previous week&apos;s participation. You&apos;ll receive your earnings within 1-2 business days.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Is my privacy protected?</h3>
                  <p className="text-muted-foreground">
                    Absolutely. We only collect data about promotional mail content for market research purposes. Your personal information and mail are never shared.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Download App Section */}
          <section className="py-16 bg-muted/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  Download Our App
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Get the mobile app to easily photograph your mail and track your earnings
                </p>
              </div>
              
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
                {/* App Store Button */}
                <a 
                  href="https://apps.apple.com/app/your-app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 min-w-[200px]"
                >
                  <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </a>

                {/* Google Play Button */}
                <a 
                  href="https://play.google.com/store/apps/details?id=your.app.id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 min-w-[200px]"
                >
                  <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs">Get it on</div>
                    <div className="text-lg font-semibold">Google Play</div>
                  </div>
                </a>
              </div>

              {/* App Features */}
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Easy Photo Capture</h3>
                  <p className="text-xs text-muted-foreground">
                    Built-in camera with automatic mail detection
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Track Earnings</h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time points balance and weekly earnings
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5h5l-5 5-5-5h5V7a7 7 0 017-7h5v5z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Instant Sync</h3>
                  <p className="text-xs text-muted-foreground">
                    Automatic upload and backup of all photos
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-16 bg-foreground">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-background sm:text-4xl">
                Ready to Turn Your Junk Mail into Cash?
              </h2>
              <p className="mt-4 text-xl text-background/80">
                Join our mail panel and start earning $5-$15 every week
              </p>
              <div className="mt-8">
                <SignUpButton mode="modal">
                  <Button size="lg" className="bg-background text-foreground hover:bg-muted font-semibold px-8 py-3">
                    Join the Panel Today
                  </Button>
                </SignUpButton>
              </div>
              <p className="mt-4 text-sm text-background/80">
                Free to join • No equipment needed • Weekly guaranteed payments • 100-point welcome bonus
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