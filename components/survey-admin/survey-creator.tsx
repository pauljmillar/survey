'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QuestionBuilder } from './question-builder'
import { JsonUpload } from './json-upload'
import { CheckCircle, AlertCircle } from 'lucide-react'

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

interface SurveyData {
  title: string
  description: string
  points_reward: number
  estimated_completion_time: number
  questions: Question[]
}

export function SurveyCreator() {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    title: '',
    description: '',
    points_reward: 100,
    estimated_completion_time: 5,
    questions: []
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

  const handleQuestionsChange = (questions: Question[]) => {
    setSurveyData(prev => ({ ...prev, questions }))
  }

  const handleJsonImport = (importedData: SurveyData) => {
    setSurveyData(importedData)
    setActiveTab('questions')
    setResult({ success: true, message: 'Survey imported successfully! You can now review and edit the questions.' })
  }

  const validateSurvey = (): string | null => {
    if (!surveyData.title.trim()) {
      return 'Survey title is required'
    }
    if (!surveyData.description.trim()) {
      return 'Survey description is required'
    }
    if (surveyData.points_reward <= 0) {
      return 'Points reward must be greater than 0'
    }
    if (surveyData.estimated_completion_time <= 0) {
      return 'Estimated completion time must be greater than 0'
    }
    if (surveyData.questions.length === 0) {
      return 'At least one question is required'
    }

    // Validate each question
    for (let i = 0; i < surveyData.questions.length; i++) {
      const question = surveyData.questions[i]
      if (!question.question_text.trim()) {
        return `Question ${i + 1}: Question text is required`
      }
      if ((question.question_type === 'multiple_choice' || question.question_type === 'checkbox') && 
          (!question.options || question.options.length < 2)) {
        return `Question ${i + 1}: At least 2 options are required for ${question.question_type} questions`
      }
    }

    return null
  }

  const createSurvey = async () => {
    const validationError = validateSurvey()
    if (validationError) {
      setResult({ success: false, message: validationError })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Create the survey first
      const surveyResponse = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: surveyData.title,
          description: surveyData.description,
          points_reward: surveyData.points_reward,
          estimated_completion_time: surveyData.estimated_completion_time,
          status: 'draft'
        }),
      })

      if (!surveyResponse.ok) {
        const errorData = await surveyResponse.json()
        throw new Error(errorData.error || 'Failed to create survey')
      }

      const survey = await surveyResponse.json()

      // Create the questions
      const questionsResponse = await fetch(`/api/surveys/${survey.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: surveyData.questions
        }),
      })

      if (!questionsResponse.ok) {
        const errorData = await questionsResponse.json()
        throw new Error(errorData.error || 'Failed to create questions')
      }

      setResult({ 
        success: true, 
        message: `Survey "${surveyData.title}" created successfully with ${surveyData.questions.length} questions!` 
      })

      // Reset form
      setSurveyData({
        title: '',
        description: '',
        points_reward: 100,
        estimated_completion_time: 5,
        questions: []
      })
      setActiveTab('basic')

    } catch (error) {
      console.error('Error creating survey:', error)
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create survey' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="import">Import JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Survey Information</CardTitle>
              <CardDescription>
                Enter the basic details for your survey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Survey Title</Label>
                <Input
                  id="title"
                  value={surveyData.title}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter survey title..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={surveyData.description}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this survey is about..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="points">Points Reward</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={surveyData.points_reward}
                    onChange={(e) => setSurveyData(prev => ({ ...prev, points_reward: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="time">Estimated Time (minutes)</Label>
                  <Input
                    id="time"
                    type="number"
                    min="1"
                    value={surveyData.estimated_completion_time}
                    onChange={(e) => setSurveyData(prev => ({ ...prev, estimated_completion_time: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setActiveTab('questions')}
                  disabled={!surveyData.title.trim() || !surveyData.description.trim()}
                >
                  Next: Add Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <QuestionBuilder
            questions={surveyData.questions}
            onQuestionsChange={handleQuestionsChange}
          />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('basic')}>
              Back to Basic Info
            </Button>
            <Button 
              onClick={createSurvey}
              disabled={loading || surveyData.questions.length === 0}
            >
              {loading ? 'Creating Survey...' : 'Create Survey'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <JsonUpload
            onImport={handleJsonImport}
            onCancel={() => setActiveTab('basic')}
          />
        </TabsContent>
      </Tabs>

      {/* Result Messages */}
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {/* Survey Summary */}
      {surveyData.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Survey Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs font-medium">Title</Label>
                <p className="font-medium">{surveyData.title || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-xs font-medium">Points</Label>
                <p className="font-medium">{surveyData.points_reward}</p>
              </div>
              <div>
                <Label className="text-xs font-medium">Time</Label>
                <p className="font-medium">{surveyData.estimated_completion_time} min</p>
              </div>
              <div>
                <Label className="text-xs font-medium">Questions</Label>
                <p className="font-medium">{surveyData.questions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 