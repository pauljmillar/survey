'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Eye
} from 'lucide-react'
import { QuestionBuilder } from './question-builder'
import { QualificationCriteria } from './qualification-criteria'

interface Question {
  id?: string
  question_text: string
  question_type: 'multiple_choice' | 'text' | 'rating' | 'checkbox' | 'yes_no' | 'date_time'
  question_order: number
  is_required: boolean
  options?: string[]
  validation_rules?: {
    min_length?: number
    max_length?: number
    min_selections?: number
    max_selections?: number
    min_value?: number
    max_value?: number
  }
}

interface SurveyQuestion {
  id?: string
  question_text: string
  question_type: 'multiple_choice' | 'text' | 'rating' | 'checkbox' | 'yes_no' | 'date_time'
  question_order: number
  is_required: boolean
  options: string[] | null
  validation_rules: any | null
}

interface Survey {
  id: string
  title: string
  description: string
  points_reward: number
  estimated_completion_time: number
  status: 'draft' | 'active' | 'inactive'
  qualification_criteria?: {
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
  created_at: string
  updated_at: string
  questions?: SurveyQuestion[]
}

interface SurveyEditorProps {
  surveyId: string
  onBack: () => void
  onSave: () => void
}

export function SurveyEditor({ surveyId, onBack, onSave }: SurveyEditorProps) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    fetchSurvey()
  }, [surveyId])

  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true)
      const [surveyResponse, questionsResponse] = await Promise.all([
        fetch(`/api/surveys/${surveyId}`),
        fetch(`/api/surveys/${surveyId}/questions`)
      ])

      if (!surveyResponse.ok) {
        throw new Error('Failed to fetch survey')
      }

      const surveyData = await surveyResponse.json()
      const questionsData = questionsResponse.ok ? await questionsResponse.json() : { questions: [] }

      setSurvey(surveyData.survey)
      // Convert SurveyQuestion[] to Question[]
      const convertedQuestions: Question[] = (questionsData.questions || []).map((q: SurveyQuestion) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        question_order: q.question_order,
        is_required: q.is_required,
        options: q.options || undefined,
        validation_rules: q.validation_rules || undefined
      }))
      setQuestions(convertedQuestions)
    } catch (error) {
      console.error('Error fetching survey:', error)
      setError('Failed to load survey')
    } finally {
      setLoading(false)
    }
  }, [surveyId])

  const handleSurveyUpdate = (field: keyof Survey, value: any) => {
    if (!survey) return
    setSurvey({ ...survey, [field]: value })
  }

  const handleQuestionsUpdate = (newQuestions: Question[]) => {
    setQuestions(newQuestions)
  }

  const handleSave = async () => {
    if (!survey) return

    try {
      setSaving(true)
      
      // Update survey details
      const surveyResponse = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: survey.title,
          description: survey.description,
          points_reward: survey.points_reward,
          estimated_completion_time: survey.estimated_completion_time,
          status: survey.status,
          qualification_criteria: survey.qualification_criteria
        })
      })

      if (!surveyResponse.ok) {
        const errorData = await surveyResponse.json()
        throw new Error(errorData.error || 'Failed to update survey')
      }

      // Convert Question[] back to SurveyQuestion[] for API
      const surveyQuestions: SurveyQuestion[] = questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        question_order: q.question_order,
        is_required: q.is_required,
        options: q.options || null,
        validation_rules: q.validation_rules || null
      }))

      // Update questions
      const questionsResponse = await fetch(`/api/surveys/${surveyId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: surveyQuestions })
      })

      if (!questionsResponse.ok) {
        const errorData = await questionsResponse.json()
        console.error('Questions update error:', errorData)
        throw new Error(errorData.error || 'Failed to update questions')
      }

      // Recalculate audience if qualification criteria changed
      if (survey.qualification_criteria && Object.keys(survey.qualification_criteria).length > 0) {
        try {
          await fetch(`/api/surveys/${surveyId}/recalculate-audience`, {
            method: 'POST',
          })
        } catch (error) {
          console.warn('Failed to recalculate audience:', error)
          // Don't fail the save if audience calculation fails
        }
      }

      onSave()
    } catch (error) {
      console.error('Error saving survey:', error)
      setError(error instanceof Error ? error.message : 'Failed to save survey')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading survey...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Survey not found'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Survey</h1>
            <p className="text-gray-600 dark:text-gray-400">Update survey details and questions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Survey Details */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
          <CardDescription>Update the basic information for this survey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={survey.title}
                onChange={(e) => handleSurveyUpdate('title', e.target.value)}
                placeholder="Enter survey title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={survey.status} onValueChange={(value) => handleSurveyUpdate('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={survey.description}
              onChange={(e) => handleSurveyUpdate('description', e.target.value)}
              placeholder="Enter survey description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points Reward</Label>
              <Input
                id="points"
                type="number"
                value={survey.points_reward}
                onChange={(e) => handleSurveyUpdate('points_reward', parseInt(e.target.value))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Estimated Time (minutes)</Label>
              <Input
                id="time"
                type="number"
                value={survey.estimated_completion_time}
                onChange={(e) => handleSurveyUpdate('estimated_completion_time', parseInt(e.target.value))}
                min="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audience */}
      <Card>
        <CardHeader>
          <CardTitle>Target Audience</CardTitle>
          <CardDescription>Define who is eligible to take this survey. Leave empty to allow all panelists.</CardDescription>
        </CardHeader>
        <CardContent>
          <QualificationCriteria
            criteria={survey.qualification_criteria || {}}
            onChange={(criteria) => handleSurveyUpdate('qualification_criteria', criteria)}
          />
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({questions.length})</CardTitle>
          <CardDescription>Add, edit, or reorder questions for this survey</CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionBuilder
            questions={questions}
            onQuestionsChange={handleQuestionsUpdate}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  )
} 