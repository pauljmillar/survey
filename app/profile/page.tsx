'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, User, MapPin, Calendar, Heart } from 'lucide-react'
import Link from 'next/link'

interface ProfileData {
  first_name?: string
  last_name?: string
  age?: number
  gender?: string
  location?: {
    country?: string
    state?: string
    city?: string
  }
  interests?: string[]
  demographics?: {
    income_range?: string
    education?: string
    employment?: string
  }
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, userRole } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/panelist-profile')
        if (response.ok) {
          const data = await response.json()
          setProfileData(data.profile_data || {})
        } else {
          setError('Failed to load profile data')
        }
      } catch (err) {
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    if (userRole === 'panelist') {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [userRole])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Error Loading Profile</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (userRole !== 'panelist') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Admin Profile</h2>
            <p className="text-muted-foreground mb-6">
              Profile management is available for panelists only.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Role:</strong> {userRole}</p>
              <p><strong>Email:</strong> {user?.emailAddress}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
              <Link href="/profile/edit">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {profileData?.first_name && profileData?.last_name 
                      ? `${profileData.first_name} ${profileData.last_name}`
                      : 'Name not set'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                </div>
              </div>

              {profileData?.age && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{profileData.age} years old</p>
                    <p className="text-xs text-muted-foreground">Age</p>
                  </div>
                </div>
              )}

              {profileData?.gender && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{profileData.gender}</p>
                    <p className="text-xs text-muted-foreground">Gender</p>
                  </div>
                </div>
              )}

              {profileData?.location?.country && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {profileData.location.country}
                      {profileData.location.state && `, ${profileData.location.state}`}
                      {profileData.location.city && `, ${profileData.location.city}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Location</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Interests & Demographics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Preferences</h2>

            {profileData?.interests && profileData.interests.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Heart className="w-4 h-4 mr-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Interests</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profileData?.demographics && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Demographics</h3>
                <div className="space-y-2 text-sm">
                  {profileData.demographics.income_range && (
                    <div>
                      <span className="text-muted-foreground">Income:</span>{' '}
                      <span className="font-medium">{profileData.demographics.income_range.replace('_', ' ')}</span>
                    </div>
                  )}
                  {profileData.demographics.education && (
                    <div>
                      <span className="text-muted-foreground">Education:</span>{' '}
                      <span className="font-medium capitalize">{profileData.demographics.education.replace('_', ' ')}</span>
                    </div>
                  )}
                  {profileData.demographics.employment && (
                    <div>
                      <span className="text-muted-foreground">Employment:</span>{' '}
                      <span className="font-medium capitalize">{profileData.demographics.employment.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!profileData?.interests && !profileData?.demographics && (
              <p className="text-sm text-muted-foreground">
                No preferences set. Edit your profile to add interests and demographics.
              </p>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Link href="/profile/edit">
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile & Demographics
              </Button>
            </Link>
            <Link href="/surveys">
              <Button variant="outline">
                Browse Surveys
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
} 