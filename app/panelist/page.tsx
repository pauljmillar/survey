'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Award, 
  Clock, 
  Users, 
  Calendar,
  CheckCircle,
  Play
} from 'lucide-react'

interface Survey {
  id: string
  title: string
  description: string
  points_reward: number
  estimated_completion_time: number
  status: 'draft' | 'active' | 'inactive'
  created_at: string
  updated_at: string
}

interface PanelistProfile {
  id: string
  user_id: string
  points_balance: number
  total_points_earned: number
  total_points_redeemed: number
  profile_data: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function PanelistDashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [profile, setProfile] = useState<PanelistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [surveysResponse, profileResponse] = await Promise.all([
        fetch('/api/panelist/surveys'),
        fetch('/api/auth/panelist-profile')
      ])

      if (!surveysResponse.ok) {
        throw new Error('Failed to fetch surveys')
      }

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile')
      }

      const surveysData = await surveysResponse.json()
      const profileData = await profileResponse.json()

      setSurveys(surveysData.surveys || [])
      setProfile(profileData.profile)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary", 
      draft: "outline"
    } as const
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 pt-12">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 pt-12">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back!</h1>
        <p className="text-muted-foreground mt-2">
          Complete surveys to earn points and redeem rewards.
        </p>
      </div>

      {/* Points Balance */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Your Points Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{profile.points_balance}</p>
                <p className="text-sm text-muted-foreground">Current Balance</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">{profile.total_points_earned}</p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-orange-600">{profile.total_points_redeemed}</p>
                <p className="text-sm text-muted-foreground">Total Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Surveys */}
      <Card>
        <CardHeader>
          <CardTitle>Available Surveys</CardTitle>
          <CardDescription>
            Complete surveys to earn points. Click on any survey to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {surveys.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No surveys available at the moment. Check back later!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{survey.title}</h3>
                        {getStatusBadge(survey.status)}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {survey.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          <span>{survey.points_reward} points</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{survey.estimated_completion_time} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {formatDate(survey.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        size="sm"
                        onClick={() => {
                          // Navigate to survey taking interface
                          window.location.href = `/panelist/survey/${survey.id}`
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Survey
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 