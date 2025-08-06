'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { z } from 'zod'

const profileSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  age: z.number().min(13).max(120),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  location: z.object({
    country: z.string().min(2).optional(),
    state: z.string().optional(),
    city: z.string().optional(),
  }),
  interests: z.array(z.string()).min(1).max(10),
  demographics: z.object({
    income_range: z.enum(['under_25k', '25k_50k', '50k_75k', '75k_100k', 'over_100k', 'prefer_not_to_say']).optional(),
    education: z.enum(['high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'other']).optional(),
    employment: z.enum(['employed', 'self_employed', 'unemployed', 'student', 'retired', 'other']).optional(),
  }).optional(),
})

type ProfileData = z.infer<typeof profileSchema>

const INTEREST_OPTIONS = [
  'Technology', 'Health & Wellness', 'Food & Dining', 'Travel', 'Entertainment',
  'Fashion & Beauty', 'Sports & Fitness', 'Finance', 'Education', 'Shopping',
  'Home & Garden', 'Automotive', 'Gaming', 'Books & Media', 'Environment'
]

interface RegistrationWizardProps {
  onComplete: () => void
  isEditMode?: boolean
  existingData?: any
}

export function RegistrationWizard({ onComplete, isEditMode = false, existingData }: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { user } = useAuth()
  const router = useRouter()

  // Pre-populate form data if in edit mode
  const [formData, setFormData] = useState<Partial<ProfileData>>(() => {
    if (isEditMode && existingData) {
      return {
        age: existingData.age || undefined,
        gender: existingData.gender || '',
        location: existingData.location || {},
        interests: existingData.interests || [],
        demographics: existingData.demographics || {},
      }
    }
    return {
      location: {},
      interests: [],
      demographics: {},
    }
  })

  const totalSteps = 4

  const updateFormData = (updates: Partial<ProfileData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      location: { ...prev.location, ...updates.location },
      demographics: { ...prev.demographics, ...updates.demographics },
    }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.age || formData.age < 13 || formData.age > 120) {
          newErrors.age = 'Please enter a valid age (13-120)'
        }
        if (!formData.gender) {
          newErrors.gender = 'Please select a gender'
        }
        break
      case 2:
        if (!formData.location?.country || formData.location.country.length < 2) {
          newErrors.country = 'Please enter your country'
        }
        break
      case 3:
        if (!formData.interests || formData.interests.length === 0) {
          newErrors.interests = 'Please select at least one interest'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleInterestToggle = (interest: string) => {
    const currentInterests = formData.interests || []
    const updated = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest]
    
    updateFormData({ interests: updated })
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setLoading(true)
    try {
      // Validate full form data
      const validatedData = profileSchema.parse(formData)

      // Always use Clerk user data for names
      const userData = {
        ...validatedData,
        first_name: user?.firstName || 'Unknown',
        last_name: user?.lastName || 'User'
      }

      // Submit to API
      const response = await fetch('/api/auth/panelist-profile', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileData: userData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} profile`)
      }

      // Profile created/updated successfully
      onComplete()
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} profile:`, error)
      setErrors({ 
        submit: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} profile` 
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Update Basic Information' : 'Basic Information'}
              </h2>
              <p className="text-gray-600">
                {isEditMode ? 'Update your personal information' : 'Tell us a bit about yourself'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="13"
                  max="120"
                  value={formData.age || ''}
                  onChange={(e) => updateFormData({ age: parseInt(e.target.value) || undefined })}
                  className={errors.age ? 'border-red-500' : ''}
                />
                {errors.age && <p className="text-sm text-red-600 mt-1">{errors.age}</p>}
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender || ''}
                  onChange={(e) => updateFormData({ gender: e.target.value as any })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="text-sm text-red-600 mt-1">{errors.gender}</p>}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Update Location' : 'Location'}
              </h2>
              <p className="text-gray-600">
                {isEditMode ? 'Update your location information' : 'Help us find relevant surveys for your area'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.location?.country || ''}
                  onChange={(e) => updateFormData({ 
                    location: { ...formData.location, country: e.target.value }
                  })}
                  placeholder="e.g., United States"
                  className={errors.country ? 'border-red-500' : ''}
                />
                {errors.country && <p className="text-sm text-red-600 mt-1">{errors.country}</p>}
              </div>

              <div>
                <Label htmlFor="state">State/Province (Optional)</Label>
                <Input
                  id="state"
                  value={formData.location?.state || ''}
                  onChange={(e) => updateFormData({ 
                    location: { ...formData.location, state: e.target.value }
                  })}
                  placeholder="e.g., California"
                />
              </div>

              <div>
                <Label htmlFor="city">City (Optional)</Label>
                <Input
                  id="city"
                  value={formData.location?.city || ''}
                  onChange={(e) => updateFormData({ 
                    location: { ...formData.location, city: e.target.value }
                  })}
                  placeholder="e.g., Los Angeles"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Update Interests' : 'Interests'}
              </h2>
              <p className="text-gray-600">
                {isEditMode ? 'Update your topic preferences' : 'Select topics you\'d like to share opinions about'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-3 text-sm rounded-lg border transition-all ${
                    formData.interests?.includes(interest)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            {errors.interests && <p className="text-sm text-red-600 mt-1">{errors.interests}</p>}
            
            <p className="text-sm text-gray-500 text-center">
              Selected: {formData.interests?.length || 0}/10
            </p>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Update Additional Details' : 'Additional Details'}
              </h2>
              <p className="text-gray-600">
                {isEditMode ? 'Update optional information' : 'Optional information to improve survey matching'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="income">Income Range (Optional)</Label>
                <select
                  id="income"
                  value={formData.demographics?.income_range || ''}
                  onChange={(e) => updateFormData({ 
                    demographics: { ...formData.demographics, income_range: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select income range</option>
                  <option value="under_25k">Under $25,000</option>
                  <option value="25k_50k">$25,000 - $50,000</option>
                  <option value="50k_75k">$50,000 - $75,000</option>
                  <option value="75k_100k">$75,000 - $100,000</option>
                  <option value="over_100k">Over $100,000</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <Label htmlFor="education">Education Level (Optional)</Label>
                <select
                  id="education"
                  value={formData.demographics?.education || ''}
                  onChange={(e) => updateFormData({ 
                    demographics: { ...formData.demographics, education: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select education level</option>
                  <option value="high_school">High School</option>
                  <option value="some_college">Some College</option>
                  <option value="bachelors">Bachelor&apos;s Degree</option>
                  <option value="masters">Master&apos;s Degree</option>
                  <option value="doctorate">Doctorate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="employment">Employment Status (Optional)</Label>
                <select
                  id="employment"
                  value={formData.demographics?.employment || ''}
                  onChange={(e) => updateFormData({ 
                    demographics: { ...formData.demographics, employment: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select employment status</option>
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self-employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="min-w-[100px]"
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Profile' : 'Complete Setup')}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
} 