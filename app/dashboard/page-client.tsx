'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { PanelistGuard } from '@/components/auth/auth-guard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading your dashboard...</h2>
          <p className="text-gray-600">Please wait</p>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <PanelistGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'Panelist'}!
            </h1>
            <p className="text-gray-600">Here's your dashboard overview</p>
          </div>

          {profile && (
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              {/* Points Balance Card */}
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">$</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Points Balance</p>
                    <p className="text-2xl font-bold text-gray-900">{profile.points_balance}</p>
                  </div>
                </div>
              </Card>

              {/* Total Earned Card */}
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-lg">↗</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Earned</p>
                    <p className="text-2xl font-bold text-gray-900">{profile.total_points_earned}</p>
                  </div>
                </div>
              </Card>

              {/* Total Redeemed Card */}
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-lg">🎁</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Redeemed</p>
                    <p className="text-2xl font-bold text-gray-900">{profile.total_points_redeemed}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl">📋</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Available Surveys</h3>
                <p className="text-sm text-gray-600 mb-4">Complete surveys to earn points</p>
                <Button className="w-full">View Surveys</Button>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-2xl">🏪</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Reward Store</h3>
                <p className="text-sm text-gray-600 mb-4">Redeem points for rewards</p>
                <Button variant="outline" className="w-full">Browse Offers</Button>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-2xl">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Activity</h3>
                <p className="text-sm text-gray-600 mb-4">View your points history</p>
                <Button variant="outline" className="w-full">View Activity</Button>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 text-2xl">⚙️</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Profile</h3>
                <p className="text-sm text-gray-600 mb-4">Update your preferences</p>
                <Button variant="outline" className="w-full">Edit Profile</Button>
              </div>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="mt-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity yet.</p>
                <p className="text-sm mt-2">Complete your first survey to see activity here!</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PanelistGuard>
  )
}
