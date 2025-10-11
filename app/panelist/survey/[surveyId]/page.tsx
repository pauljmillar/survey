'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Circle,
  Star,
  Calendar,
  Award,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SurveyQuestion {
  id: string
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
  created_at: string
  updated_at: string
  questions: SurveyQuestion[]
}

interface SurveyResponse {
  question_id: string
  response_value: string
  response_metadata?: any
}

export default function SurveyTakingPage({ params }: { params: { surveyId: string } }) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{ [questionId: string]: any }>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching survey:', params.surveyId)
      
      const [surveyResponse, questionsResponse] = await Promise.all([
        fetch(`/api/surveys/${params.surveyId}`),
        fetch(`/api/surveys/${params.surveyId}/questions`)
      ])

      console.log('Survey response status:', surveyResponse.status)
      console.log('Questions response status:', questionsResponse.status)

      if (!surveyResponse.ok) {
        const errorData = await surveyResponse.json()
        console.error('Survey response error:', errorData)
        throw new Error(`Failed to fetch survey: ${errorData.error || surveyResponse.statusText}`)
      }

      const surveyData = await surveyResponse.json()
      console.log('Survey data:', surveyData)

      let questionsData = { questions: [] }
      if (questionsResponse.ok) {
        questionsData = await questionsResponse.json()
        console.log('Questions data:', questionsData)
      } else {
        console.warn('Questions response not ok:', questionsResponse.status, questionsResponse.statusText)
      }

      const surveyWithQuestions = {
        ...surveyData.survey,
        questions: questionsData.questions || []
      }
      
      console.log('Final survey with questions:', surveyWithQuestions)
      
      if (surveyWithQuestions.questions.length === 0) {
        setError('This survey has no questions. Please contact the administrator.')
        return
      }

      setSurvey(surveyWithQuestions)
    } catch (error) {
      console.error('Error fetching survey:', error)
      setError(error instanceof Error ? error.message : 'Failed to load survey')
    } finally {
      setLoading(false)
    }
  }, [params.surveyId])

  useEffect(() => {
    fetchSurvey()
  }, [fetchSurvey])

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex < (survey?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const isCurrentQuestionValid = () => {
    if (!survey) return false
    const currentQuestion = survey.questions[currentQuestionIndex]
    if (!currentQuestion.is_required) return true
    
    const response = responses[currentQuestion.id]
    if (!response) return false

    switch (currentQuestion.question_type) {
      case 'text':
        return response.trim().length > 0
      case 'multiple_choice':
      case 'yes_no':
        return response !== ''
      case 'checkbox':
        return Array.isArray(response) && response.length > 0
      case 'rating':
        return typeof response === 'number' && response > 0
      case 'date_time':
        return response !== ''
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (!survey) return

    // Ensure we have questions before submitting
    if (!survey.questions || survey.questions.length === 0) {
      setError('No questions found for this survey. Please contact the administrator.')
      return
    }

    // Ensure we have responses for all required questions
    const requiredQuestions = survey.questions.filter(q => q.is_required)
    const missingResponses = requiredQuestions.filter(q => !responses[q.id])
    
    if (missingResponses.length > 0) {
      setError(`Please answer all required questions before submitting.`)
      return
    }

    try {
      setSubmitting(true)
      
      const surveyResponses: SurveyResponse[] = Object.entries(responses).map(([questionId, value]) => ({
        question_id: questionId,
        response_value: Array.isArray(value) ? value.join(', ') : String(value),
        response_metadata: {
          submitted_at: new Date().toISOString(),
          question_type: survey.questions.find(q => q.id === questionId)?.question_type
        }
      }))

      console.log('Submitting survey with responses:', surveyResponses)

      const response = await fetch('/api/panelist/survey-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: survey.id,
          responses: surveyResponses
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit survey')
      }

      // Navigate to completion page
      router.push(`/panelist/survey/${survey.id}/complete`)
    } catch (error) {
      console.error('Error submitting survey:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit survey')
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: SurveyQuestion) => {
    const currentResponse = responses[question.id]

    switch (question.question_type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={`question-${question.id}`}>Your answer</Label>
            <Textarea
              id={`question-${question.id}`}
              value={currentResponse || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              placeholder="Type your answer here..."
              rows={4}
            />
          </div>
        )

      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentResponse || ''}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${question.id}-${index}`} />
                  <Label htmlFor={`option-${question.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )

      case 'checkbox':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`checkbox-${question.id}-${index}`}
                  checked={Array.isArray(currentResponse) && currentResponse.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentArray = Array.isArray(currentResponse) ? currentResponse : []
                    if (checked) {
                      handleResponseChange(question.id, [...currentArray, option])
                    } else {
                      handleResponseChange(question.id, currentArray.filter(item => item !== option))
                    }
                  }}
                />
                <Label htmlFor={`checkbox-${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case 'rating':
        return (
          <div className="space-y-2">
            <Label>Rate from 1 to 5</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={currentResponse === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleResponseChange(question.id, rating)}
                >
                  <Star className={`h-4 w-4 ${currentResponse === rating ? 'fill-current' : ''}`} />
                  {rating}
                </Button>
              ))}
            </div>
          </div>
        )

      case 'yes_no':
        return (
          <RadioGroup
            value={currentResponse || ''}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`}>No</Label>
              </div>
            </div>
          </RadioGroup>
        )

      case 'date_time':
        return (
          <div className="space-y-2">
            <Label htmlFor={`question-${question.id}`}>Select date and time</Label>
            <Input
              id={`question-${question.id}`}
              type="datetime-local"
              value={currentResponse || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
            />
          </div>
        )

      default:
        return <div>Unsupported question type</div>
    }
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

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Survey not found'}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Check if we have questions
  if (!survey.questions || survey.questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">
              This survey has no questions. Please contact the administrator.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = survey.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{survey.title}</h1>
              <p className="text-muted-foreground mt-1">{survey.description}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>{survey.points_reward} points</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{survey.estimated_completion_time} min</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {survey.questions.length}</span>
              <div className="w-32 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / survey.questions.length) * 100}%` }}
                />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Exit Survey
            </Button>
          </div>

          {/* Question Card */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {currentQuestionIndex + 1}
                </span>
                {currentQuestion.is_required && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </div>
              <CardTitle className="text-lg">{currentQuestion.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderQuestion(currentQuestion)}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {!isLastQuestion ? (
                <Button
                  onClick={goToNextQuestion}
                  disabled={!isCurrentQuestionValid()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isCurrentQuestionValid() || submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Survey'}
                  <CheckCircle className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="max-w-2xl mx-auto p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 