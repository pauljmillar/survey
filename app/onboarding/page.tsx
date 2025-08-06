'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { RegistrationWizard } from '@/components/panelist/registration-wizard'
import { Card } from '@/components/ui/card'

export default function OnboardingPage() {
  const { user, userRole, loading, isSignedIn } = useAuth()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [profileCheckComplete, setProfileCheckComplete] = useState(false)
  const router = useRouter()

  const checkExistingProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/panelist-profile')
      
      if (response.ok) {
        // User already has a profile, redirect to dashboard
        setHasProfile(true)
        router.push('/dashboard')
      } else if (response.status === 404) {
        // No profile exists, show registration wizard
        setHasProfile(false)
      } else {
        console.error('Error checking profile:', await response.text())
        setHasProfile(false)
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      setHasProfile(false)
    } finally {
      setProfileCheckComplete(true)
    }
  }, [router])

  useEffect(() => {
    if (!loading && !isSignedIn) {
      router.push('/')
      return
    }

    // Wait for auth to be loaded and user to be signed in
    if (!loading && isSignedIn) {
      // Check if user already has a panelist profile
      checkExistingProfile()
    }
  }, [loading, isSignedIn, router, checkExistingProfile])

  const handleRegistrationComplete = () => {
    // Redirect to dashboard after successful registration
    router.push('/dashboard')
  }

  // Show loading state while auth is loading or profile check is in progress
  if (loading || !profileCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your account...</h2>
          <p className="text-gray-600">Please wait while we prepare your dashboard</p>
        </Card>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isSignedIn) {
    return null
  }

  // Show registration wizard for users without profiles
  if (hasProfile === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to the Panelist Platform!</h1>
              <p className="mt-2 text-lg text-gray-600">
                Let&apos;s set up your profile to start earning points
              </p>
            </div>
          </div>
        </div>
        
        <RegistrationWizard onComplete={handleRegistrationComplete} />
      </div>
    )
  }

  // This shouldn't be reached due to redirect, but just in case
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile already exists</h2>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </Card>
    </div>
  )
} 