'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { PanelistGuard } from '@/components/auth/auth-guard'

import { CompactSurveyList } from '@/components/panelist/survey-list'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PanelistProfile {
  id: string
  points_balance: number
  total_points_earned: number
  total_points_redeemed: number
  profile_data: any
  is_active: boolean
}

export default function DashboardClient() {
  const { user, userRole, loading, isSignedIn } = useAuth()
  const [profile, setProfile] = useState<PanelistProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && isSignedIn && userRole === 'panelist') {
      checkPanelistProfile()
    }
  }, [loading, isSignedIn, userRole])

  const checkPanelistProfile = async () => {
    try {
      const response = await fetch('/api/auth/panelist-profile')
      
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
      } else if (response.status === 404) {
        // No profile exists, redirect to onboarding
        router.push('/onboarding')
        return
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load profile')
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      setError('Failed to load profile')
    } finally {
      setProfileLoading(false)
    }
  }

  // Show loading state
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading your dashboard...</h2>
          <p className="text-muted-foreground">Please wait</p>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <PanelistGuard>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Header with Last Updated Timestamp */}
      <div className="mb-8 pt-32 pb-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.firstName || 'Panelist'}!
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

          {/* Main Dashboard Layout - 5 Panels */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Available Surveys - Takes ~2/3 width */}
            <div className="lg:col-span-2">
              <Card className="p-6 h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Available Surveys</h2>
                  <Link href="/surveys">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                
                <CompactSurveyList limit={5} />
              </Card>
            </div>

            {/* Right Side - 4 Smaller Panels */}
            <div className="space-y-4">
              {/* Available Points */}
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {profile ? profile.points_balance.toLocaleString() : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Available Points</div>
                </div>
              </Card>

              {/* Total Earned */}
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {profile ? profile.total_points_earned.toLocaleString() : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Earned</div>
                </div>
              </Card>

              {/* Total Redeemed */}
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {profile ? profile.total_points_redeemed.toLocaleString() : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Redeemed</div>
                </div>
              </Card>

              {/* Surveys Completed */}
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {profile ? Math.floor(profile.total_points_earned / 100) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Surveys Completed</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PanelistGuard>
  )
}
