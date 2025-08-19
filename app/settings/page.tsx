'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, X } from 'lucide-react'

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

interface Program {
  id: string
  name: string
  display_name: string
  description: string
  is_active: boolean
  is_opted_in?: boolean
  opted_in_at?: string | null
}

export default function SettingsPage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [editedProfileData, setEditedProfileData] = useState<ProfileData | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [editedPrograms, setEditedPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { user, userRole } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, programsResponse] = await Promise.all([
          fetch('/api/auth/panelist-profile'),
          fetch('/api/panelist/programs')
        ])

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          const profile = profileData.profile_data || {}
          setProfileData(profile)
          setEditedProfileData(profile)
        } else {
          setError('Failed to load profile data')
        }

        if (programsResponse.ok) {
          const programsData = await programsResponse.json()
          const programsList = programsData.programs || []
          setPrograms(programsList)
          setEditedPrograms(programsList)
        } else {
          console.error('Failed to load programs')
        }
      } catch (err) {
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    if (userRole === 'panelist') {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [userRole])

  // Check for changes
  useEffect(() => {
    const profileChanged = JSON.stringify(profileData) !== JSON.stringify(editedProfileData)
    const programsChanged = JSON.stringify(programs) !== JSON.stringify(editedPrograms)
    setHasChanges(profileChanged || programsChanged)
  }, [profileData, editedProfileData, programs, editedPrograms])

  const handleProfileDataChange = (field: string, value: any) => {
    setEditedProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDemographicsChange = (field: string, value: any) => {
    setEditedProfileData(prev => ({
      ...prev,
      demographics: {
        ...prev?.demographics,
        [field]: value
      }
    }))
  }

  const handleLocationChange = (field: string, value: any) => {
    setEditedProfileData(prev => ({
      ...prev,
      location: {
        ...prev?.location,
        [field]: value
      }
    }))
  }

  const handleProgramToggle = (programName: string, optIn: boolean) => {
    setEditedPrograms(prev => prev.map(program => 
      program.name === programName 
        ? { ...program, is_opted_in: optIn }
        : program
    ))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Save profile data
      const profileResponse = await fetch('/api/auth/panelist-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile_data: editedProfileData })
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to save profile data')
      }

      // Save program preferences
      const programChanges = editedPrograms.filter((editedProgram, index) => {
        const originalProgram = programs[index]
        return originalProgram && editedProgram.is_opted_in !== originalProgram.is_opted_in
      })

      for (const program of programChanges) {
        const programResponse = await fetch('/api/panelist/programs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            program_name: program.name,
            opt_in: program.is_opted_in
          })
        })

        if (!programResponse.ok) {
          console.error(`Failed to update program ${program.name}`)
        }
      }

      // Update state with saved data
      setProfileData(editedProfileData)
      setPrograms(editedPrograms)
      setHasChanges(false)
      
    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProfileData(profileData)
    setEditedPrograms(programs)
    setHasChanges(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Error Loading Settings</h2>
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
            <h2 className="text-xl font-semibold mb-4">Admin Settings</h2>
            <p className="text-muted-foreground mb-6">
              Settings management is available for panelists only.
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account settings and preferences.
              </p>
            </div>
            {hasChanges && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
            <div className="text-red-700">{error}</div>
          </Card>
        )}

        <div className="space-y-6">
          {/* Profile Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Basic Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={editedProfileData?.age || ''}
                  onChange={(e) => handleProfileDataChange('age', parseInt(e.target.value) || undefined)}
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={editedProfileData?.gender || ''}
                  onValueChange={(value) => handleProfileDataChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Location</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={editedProfileData?.location?.country || ''}
                  onValueChange={(value) => handleLocationChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={editedProfileData?.location?.state || ''}
                  onChange={(e) => handleLocationChange('state', e.target.value)}
                  placeholder="Enter state/province"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editedProfileData?.location?.city || ''}
                  onChange={(e) => handleLocationChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
            </div>
          </Card>

          {/* Demographics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Demographics</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="income">Income Range</Label>
                <Select
                  value={editedProfileData?.demographics?.income_range || ''}
                  onValueChange={(value) => handleDemographicsChange('income_range', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_25k">Under $25,000</SelectItem>
                    <SelectItem value="25k_50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50k_75k">$50,000 - $75,000</SelectItem>
                    <SelectItem value="75k_100k">$75,000 - $100,000</SelectItem>
                    <SelectItem value="100k_150k">$100,000 - $150,000</SelectItem>
                    <SelectItem value="over_150k">Over $150,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="education">Education Level</Label>
                <Select
                  value={editedProfileData?.demographics?.education || ''}
                  onValueChange={(value) => handleDemographicsChange('education', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-school">High School</SelectItem>
                    <SelectItem value="some-college">Some College</SelectItem>
                    <SelectItem value="bachelors">Bachelor&apos;s Degree</SelectItem>
                    <SelectItem value="masters">Master&apos;s Degree</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employment">Employment Status</Label>
                <Select
                  value={editedProfileData?.demographics?.employment || ''}
                  onValueChange={(value) => handleDemographicsChange('employment', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed-full-time">Full-time</SelectItem>
                    <SelectItem value="employed-part-time">Part-time</SelectItem>
                    <SelectItem value="self-employed">Self-employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Research Programs */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Research Programs</h2>
                <p className="text-sm text-muted-foreground">
                  Choose which types of research opportunities you&apos;d like to participate in
                </p>
              </div>
              <Badge variant="outline">
                {editedPrograms.filter(p => p.is_opted_in).length} Active
              </Badge>
            </div>

            <div className="space-y-4">
              {editedPrograms.map(program => (
                <div key={program.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{program.display_name}</h4>
                      {program.is_opted_in && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {program.description}
                    </p>
                    {program.is_opted_in && program.opted_in_at && (
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(program.opted_in_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={program.is_opted_in || false}
                      onCheckedChange={(checked) => handleProgramToggle(program.name, checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Save Actions */}
          {hasChanges && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-blue-600">
                    You have unsaved changes
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}