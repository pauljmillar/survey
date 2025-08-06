'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from 'lucide-react'

interface QualificationCriteria {
  gender?: string[]
  age_range?: [number, number]
  location?: {
    countries?: string[]
    states?: string[]
  }
  interests?: string[]
  demographics?: {
    income_range?: string[]
    education?: string[]
    employment?: string[]
  }
}

interface QualificationCriteriaProps {
  criteria: QualificationCriteria
  onChange: (criteria: QualificationCriteria) => void
}

const GENDER_OPTIONS = ['male', 'female', 'other', 'prefer_not_to_say']
const INCOME_OPTIONS = ['under_25k', '25k_50k', '50k_75k', '75k_100k', 'over_100k', 'prefer_not_to_say']
const EDUCATION_OPTIONS = ['high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'other']
const EMPLOYMENT_OPTIONS = ['employed', 'self_employed', 'unemployed', 'student', 'retired', 'other']
const INTEREST_OPTIONS = [
  'Technology', 'Health & Wellness', 'Food & Dining', 'Travel', 'Sports & Fitness',
  'Entertainment', 'Fashion & Beauty', 'Home & Garden', 'Business & Finance',
  'Education', 'Politics', 'Science', 'Arts & Culture'
]

export function QualificationCriteria({ criteria, onChange }: QualificationCriteriaProps) {
  const [newCountry, setNewCountry] = useState('')
  const [newState, setNewState] = useState('')
  const [newInterest, setNewInterest] = useState('')

  const updateCriteria = (updates: Partial<QualificationCriteria>) => {
    onChange({ ...criteria, ...updates })
  }

  const addCountry = () => {
    if (newCountry.trim()) {
      const countries = [...(criteria.location?.countries || []), newCountry.trim()]
      updateCriteria({
        location: { ...criteria.location, countries }
      })
      setNewCountry('')
    }
  }

  const removeCountry = (country: string) => {
    const countries = (criteria.location?.countries || []).filter(c => c !== country)
    updateCriteria({
      location: { ...criteria.location, countries }
    })
  }

  const addState = () => {
    if (newState.trim()) {
      const states = [...(criteria.location?.states || []), newState.trim()]
      updateCriteria({
        location: { ...criteria.location, states }
      })
      setNewState('')
    }
  }

  const removeState = (state: string) => {
    const states = (criteria.location?.states || []).filter(s => s !== state)
    updateCriteria({
      location: { ...criteria.location, states }
    })
  }

  const addInterest = () => {
    if (newInterest.trim()) {
      const interests = [...(criteria.interests || []), newInterest.trim()]
      updateCriteria({ interests })
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    const interests = (criteria.interests || []).filter(i => i !== interest)
    updateCriteria({ interests })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Target Audience</CardTitle>
          <CardDescription>
            Define who is eligible to take this survey. Leave empty to allow all panelists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Gender */}
          <div>
            <Label className="text-sm font-medium">Gender</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {GENDER_OPTIONS.map((gender) => (
                <div key={gender} className="flex items-center space-x-2">
                  <Checkbox
                    id={`gender-${gender}`}
                    checked={criteria.gender?.includes(gender) || false}
                    onCheckedChange={(checked) => {
                      const current = criteria.gender || []
                      const updated = checked
                        ? [...current, gender]
                        : current.filter(g => g !== gender)
                      updateCriteria({ gender: updated })
                    }}
                  />
                  <Label htmlFor={`gender-${gender}`} className="text-sm capitalize">
                    {gender.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <Label className="text-sm font-medium">Age Range</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                placeholder="Min age"
                value={criteria.age_range?.[0] || ''}
                onChange={(e) => {
                  const min = parseInt(e.target.value) || 0
                  const max = criteria.age_range?.[1] || 100
                  updateCriteria({ age_range: [min, max] })
                }}
                className="w-24"
              />
              <span className="text-sm">to</span>
              <Input
                type="number"
                placeholder="Max age"
                value={criteria.age_range?.[1] || ''}
                onChange={(e) => {
                  const max = parseInt(e.target.value) || 100
                  const min = criteria.age_range?.[0] || 0
                  updateCriteria({ age_range: [min, max] })
                }}
                className="w-24"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-sm font-medium">Location</Label>
            <div className="space-y-4 mt-2">
              {/* Countries */}
              <div>
                <Label className="text-xs text-muted-foreground">Countries</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add country"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCountry()}
                  />
                  <Button size="sm" onClick={addCountry}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {criteria.location?.countries?.map((country) => (
                    <Badge key={country} variant="secondary" className="flex items-center gap-1">
                      {country}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeCountry(country)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* States */}
              <div>
                <Label className="text-xs text-muted-foreground">States/Provinces</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add state"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addState()}
                  />
                  <Button size="sm" onClick={addState}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {criteria.location?.states?.map((state) => (
                    <Badge key={state} variant="secondary" className="flex items-center gap-1">
                      {state}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeState(state)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interests */}
          <div>
            <Label className="text-sm font-medium">Interests</Label>
            <div className="space-y-2 mt-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add interest"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <Button size="sm" onClick={addInterest}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {criteria.interests?.map((interest) => (
                  <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                    {interest}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeInterest(interest)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div>
            <Label className="text-sm font-medium">Demographics</Label>
            <div className="space-y-4 mt-2">
              {/* Income Range */}
              <div>
                <Label className="text-xs text-muted-foreground">Income Range</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {INCOME_OPTIONS.map((income) => (
                    <div key={income} className="flex items-center space-x-2">
                      <Checkbox
                        id={`income-${income}`}
                        checked={criteria.demographics?.income_range?.includes(income) || false}
                        onCheckedChange={(checked) => {
                          const current = criteria.demographics?.income_range || []
                          const updated = checked
                            ? [...current, income]
                            : current.filter(i => i !== income)
                          updateCriteria({
                            demographics: { ...criteria.demographics, income_range: updated }
                          })
                        }}
                      />
                      <Label htmlFor={`income-${income}`} className="text-sm">
                        {income.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <Label className="text-xs text-muted-foreground">Education</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EDUCATION_OPTIONS.map((education) => (
                    <div key={education} className="flex items-center space-x-2">
                      <Checkbox
                        id={`education-${education}`}
                        checked={criteria.demographics?.education?.includes(education) || false}
                        onCheckedChange={(checked) => {
                          const current = criteria.demographics?.education || []
                          const updated = checked
                            ? [...current, education]
                            : current.filter(e => e !== education)
                          updateCriteria({
                            demographics: { ...criteria.demographics, education: updated }
                          })
                        }}
                      />
                      <Label htmlFor={`education-${education}`} className="text-sm capitalize">
                        {education.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment */}
              <div>
                <Label className="text-xs text-muted-foreground">Employment</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EMPLOYMENT_OPTIONS.map((employment) => (
                    <div key={employment} className="flex items-center space-x-2">
                      <Checkbox
                        id={`employment-${employment}`}
                        checked={criteria.demographics?.employment?.includes(employment) || false}
                        onCheckedChange={(checked) => {
                          const current = criteria.demographics?.employment || []
                          const updated = checked
                            ? [...current, employment]
                            : current.filter(e => e !== employment)
                          updateCriteria({
                            demographics: { ...criteria.demographics, employment: updated }
                          })
                        }}
                      />
                      <Label htmlFor={`employment-${employment}`} className="text-sm capitalize">
                        {employment.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 