'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Users, Target, Filter, Save, X } from 'lucide-react'

interface Program {
  id: string
  name: string
  display_name: string
  description: string
}

interface DemographicFilters {
  gender?: string
  ageMin?: number
  ageMax?: number
  incomeMin?: number
  incomeMax?: number
  location?: string
  educationLevel?: string
  employmentStatus?: string
}

export function AudienceBuilder() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Demographic filters
  const [filters, setFilters] = useState<DemographicFilters>({})
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Preset management
  const [presetName, setPresetName] = useState('')
  const [savedPresets, setSavedPresets] = useState<any[]>([])
  const [savingPreset, setSavingPreset] = useState(false)
  
  // Survey assignment
  const [surveys, setSurveys] = useState<any[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const fetchPrograms = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/programs')
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
        // Only set default if we have programs and no selection yet
        if (data.programs?.length > 0 && !selectedProgram) {
          setSelectedProgram(data.programs[0].name)
        }
      } else {
        setError('Failed to load programs')
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      setError('Failed to load programs')
    }
  }, [selectedProgram])

  const fetchSurveys = async () => {
    try {
      const response = await fetch('/api/surveys')
      if (response.ok) {
        const data = await response.json()
        setSurveys(data.surveys || [])
      } else {
        console.error('Failed to load surveys')
      }
    } catch (error) {
      console.error('Error fetching surveys:', error)
    }
  }

  useEffect(() => {
    fetchPrograms()
    fetchSurveys()
  }, [fetchPrograms])

  const filterAudience = async () => {
    if (!selectedProgram) return

    try {
      setLoading(true)
      setError(null)
      
      // Build filter criteria
      const filterCriteria: any = {
        program: selectedProgram
      }

      // Add demographic filters
      if (filters.gender) filterCriteria.gender = filters.gender
      if (filters.ageMin && filters.ageMax) {
        filterCriteria.age_range = [filters.ageMin, filters.ageMax]
      }
      if (filters.incomeMin && filters.incomeMax) {
        filterCriteria.income_range = [filters.incomeMin, filters.incomeMax]
      }
      if (filters.location) filterCriteria.location = [filters.location]
      if (filters.educationLevel) filterCriteria.education_level = filters.educationLevel
      if (filters.employmentStatus) filterCriteria.employment_status = filters.employmentStatus
      
      const response = await fetch('/api/admin/audiences/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: filterCriteria
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAudienceCount(data.audience_count || 0)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to calculate audience')
      }
    } catch (error) {
      console.error('Error filtering audience:', error)
      setError('Failed to calculate audience')
    } finally {
      setLoading(false)
    }
  }

  const savePreset = async () => {
    if (!presetName.trim() || !selectedProgram) return

    try {
      setSavingPreset(true)
      const filterCriteria = {
        program: selectedProgram,
        ...filters
      }

      const response = await fetch('/api/admin/audiences/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: presetName,
          description: `Audience for ${selectedProgram} with ${getActiveFilterCount()} filters`,
          filter_criteria: filterCriteria,
          audience_count: audienceCount || 0
        })
      })

      if (response.ok) {
        setPresetName('')
        fetchPresets()
        setError(null)
      } else {
        setError('Failed to save preset')
      }
    } catch (error) {
      console.error('Error saving preset:', error)
      setError('Failed to save preset')
    } finally {
      setSavingPreset(false)
    }
  }

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/admin/audiences/presets')
      if (response.ok) {
        const data = await response.json()
        setSavedPresets(data.presets || [])
      }
    } catch (error) {
      console.error('Error fetching presets:', error)
    }
  }

  const loadPreset = (preset: any) => {
    const criteria = preset.filter_criteria
    setSelectedProgram(criteria.program || '')
    setFilters({
      gender: criteria.gender,
      ageMin: criteria.ageMin,
      ageMax: criteria.ageMax,
      incomeMin: criteria.incomeMin,
      incomeMax: criteria.incomeMax,
      location: criteria.location,
      educationLevel: criteria.education_level,
      employmentStatus: criteria.employment_status
    })
    setAudienceCount(preset.audience_count)
  }

  const clearFilters = () => {
    setFilters({})
    setAudienceCount(null)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length
  }

  const updateFilter = (key: keyof DemographicFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setAudienceCount(null) // Reset count when filters change
  }

  const assignSurveyToAudience = async () => {
    if (!selectedSurveyId || !selectedProgram) return

    try {
      setAssigning(true)
      setError(null)

      // For now, we'll use the filter API directly to assign to the current audience
      const response = await fetch(`/api/admin/surveys/${selectedSurveyId}/assign-temporary-audience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          program: selectedProgram,
          filters: {
            program: selectedProgram,
            ...filters
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setError(null)
        alert(`Survey successfully assigned to ${data.panelist_count} panelists!`)
        setSelectedSurveyId('') // Reset selection
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to assign survey')
      }
    } catch (error) {
      console.error('Error assigning survey:', error)
      setError('Failed to assign survey')
    } finally {
      setAssigning(false)
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Audience Builder
        </CardTitle>
        <CardDescription>
          Create targeted audiences for your surveys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Program Selection */}
        <div>
          <Label className="text-sm font-medium">Program *</Label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choose a program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map(program => (
                <SelectItem key={program.id} value={program.name || 'default'}>
                  {program.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Toggle */}
        <div>
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50 dark:bg-muted/20">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Demographic Filters</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={getActiveFilterCount() === 0}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            {/* Gender Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Gender</Label>
                <Select
                  value={filters.gender || 'any'}
                  onValueChange={(value) => updateFilter('gender', value === 'any' ? undefined : value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Location</Label>
                <Select
                  value={filters.location || 'any'}
                  onValueChange={(value) => updateFilter('location', value === 'any' ? undefined : value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Age Range */}
            <div>
              <Label className="text-sm">Age Range</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Min age"
                  value={filters.ageMin || ''}
                  onChange={(e) => updateFilter('ageMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={18}
                  max={100}
                />
                <Input
                  type="number"
                  placeholder="Max age"
                  value={filters.ageMax || ''}
                  onChange={(e) => updateFilter('ageMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={18}
                  max={100}
                />
              </div>
            </div>

            {/* Income Range */}
            <div>
              <Label className="text-sm">Income Range ($)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Min income"
                  value={filters.incomeMin || ''}
                  onChange={(e) => updateFilter('incomeMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                  step={1000}
                />
                <Input
                  type="number"
                  placeholder="Max income"
                  value={filters.incomeMax || ''}
                  onChange={(e) => updateFilter('incomeMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            {/* Education & Employment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Education Level</Label>
                <Select
                  value={filters.educationLevel || 'any'}
                  onValueChange={(value) => updateFilter('educationLevel', value === 'any' ? undefined : value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="high-school">High School</SelectItem>
                    <SelectItem value="some-college">Some College</SelectItem>
                    <SelectItem value="bachelors">Bachelor&apos;s Degree</SelectItem>
                    <SelectItem value="masters">Master&apos;s Degree</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Employment Status</Label>
                <Select
                  value={filters.employmentStatus || 'any'}
                  onValueChange={(value) => updateFilter('employmentStatus', value === 'any' ? undefined : value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
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
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={filterAudience} 
            disabled={loading || !selectedProgram}
            className="flex-1"
          >
            {loading ? 'Calculating...' : 'Calculate Audience Size'}
          </Button>
        </div>

        {/* Results */}
        {audienceCount !== null && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-lg font-semibold">
                {audienceCount.toLocaleString()} panelists
              </span>
            </div>
            {getActiveFilterCount() > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                With {getActiveFilterCount()} demographic filter{getActiveFilterCount() !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Save Preset */}
        {audienceCount !== null && audienceCount > 0 && (
          <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
            <Label className="text-sm font-medium">Save as Preset</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Preset name (e.g., 'Young Adults Survey')"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={savePreset}
                disabled={savingPreset || !presetName.trim()}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {savingPreset ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        {/* Assign Survey to Audience */}
        {audienceCount !== null && audienceCount > 0 && (
          <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
            <Label className="text-sm font-medium">Assign Survey to This Audience</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Select a survey to assign to the filtered audience of {audienceCount.toLocaleString()} panelists.
            </p>
            <div className="flex gap-2 mt-3">
              <Select
                value={selectedSurveyId}
                onValueChange={setSelectedSurveyId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a survey" />
                </SelectTrigger>
                <SelectContent>
                  {surveys
                    .filter(survey => survey.status === 'active')
                    .map((survey) => (
                      <SelectItem key={survey.id} value={survey.id}>
                        {survey.title} ({survey.points_reward} pts)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={assignSurveyToAudience}
                disabled={assigning || !selectedSurveyId}
                size="sm"
              >
                <Target className="h-4 w-4 mr-1" />
                {assigning ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        )}

        {/* Saved Presets */}
        {savedPresets.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Saved Presets</Label>
            <div className="grid gap-2 mt-2">
              {savedPresets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {preset.audience_count} panelists • {preset.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadPreset(preset)}>
                      Load
                    </Button>
                    {/* TODO: Implement assign preset to survey functionality */}
                    <Button variant="outline" size="sm" disabled>
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}