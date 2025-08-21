'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

import { CompactSurveyList } from '@/components/panelist/survey-list'
import { ProgramStatus } from '@/components/panelist/program-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, ClipboardList, Gift, BarChart3, Award, Camera } from 'lucide-react'

interface PanelistProfile {
  id: string
  points_balance: number
  total_points_earned: number
  total_points_redeemed: number
  total_scans: number
  surveys_completed: number
  profile_data: any
  is_active: boolean
}

interface AdminStats {
  totalSurveysCompleted: number
  totalUsers: number
  totalPointsAwarded: number
  totalScans: number
}

interface DailyScanData {
  date: string
  scans: number
}

function AdminStatsCards() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      setError('Failed to load admin statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center text-red-500">
            <p className="text-sm">Error loading stats</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Surveys Completed */}
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Surveys Completed</CardTitle>
          <ClipboardList className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.totalSurveysCompleted?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">Total completed surveys</p>
        </CardContent>
      </Card>

      {/* Total Users */}
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats?.totalUsers?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">Registered panelists</p>
        </CardContent>
      </Card>

      {/* Total Points Awarded */}
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
          <Award className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats?.totalPointsAwarded?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">Total points distributed</p>
        </CardContent>
      </Card>

      {/* Total Scans */}
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
          <Camera className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.totalScans?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">Mail images scanned</p>
        </CardContent>
      </Card>
    </div>
  )
}

function DailyScansChart() {
  const [chartData, setChartData] = useState<DailyScanData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDailyScans()
  }, [])

  const fetchDailyScans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/daily-scans')
      
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error('Error fetching daily scans:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Daily Scans - Last 14 Days</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((day, index) => (
              <div key={day.date} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-purple-600 rounded-t w-full transition-all duration-300 hover:bg-purple-700"
                  style={{ 
                    height: `${Math.max((day.scans / Math.max(...chartData.map(d => d.scans))) * 200, 4)}px` 
                  }}
                  title={`${day.date}: ${day.scans} scans`}
                ></div>
                <div className="text-xs text-muted-foreground mt-2 transform -rotate-45 origin-left">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No scan data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardClient() {
  const { user, userRole, loading, isSignedIn } = useAuth()
  const [profile, setProfile] = useState<PanelistProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkPanelistProfile = useCallback(async () => {
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
  }, [router])

  useEffect(() => {
    if (!loading && isSignedIn) {
      if (userRole === 'panelist') {
        checkPanelistProfile()
      } else {
        // For admin users, skip profile check and show dashboard
        setProfileLoading(false)
      }
    }
  }, [loading, isSignedIn, userRole, checkPanelistProfile])

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
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Welcome Header with Last Updated Timestamp */}
        <div className="mb-6 sm:mb-8 pt-24 sm:pt-32 pb-8 sm:pb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Welcome back, {user?.firstName || 'User'}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Show different content based on user role */}
        {userRole === 'panelist' ? (
          // Panelist Dashboard
          <div className="space-y-6">
            {/* Summary Boxes - Show above surveys on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 order-1 lg:order-2">
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
                    {profile ? (profile.surveys_completed || 0) : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Surveys Completed</div>
                </div>
              </Card>

              {/* Total Scans */}
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {profile ? (profile.total_scans || 0) : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Scans</div>
                </div>
              </Card>
            </div>

            {/* Survey Lists - Full width, no outer card */}
            <div className="order-2 lg:order-1 space-y-6">
              <CompactSurveyList limit={5} />
              
              {/* Program Status */}
              <ProgramStatus />
            </div>
          </div>
        ) : (
          // Admin Dashboard
          <div className="space-y-6">
            {/* Admin Stats Cards */}
            <AdminStatsCards />
            
            {/* Daily Scans Chart */}
            <DailyScansChart />
          </div>
        )}
      </div>
    </div>
  )
}
