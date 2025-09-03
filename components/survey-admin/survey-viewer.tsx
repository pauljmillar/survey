'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Calendar,
  Award,
  Users,
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Star
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
  questions?: SurveyQuestion[]
}

interface SurveyViewerProps {
  surveyId: string
  onBack: () => void
  onEdit: () => void
}

export function SurveyViewer({ surveyId, onBack, onEdit }: SurveyViewerProps) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      setSurvey({
        ...surveyData.survey,
        questions: questionsData.questions || []
      })
    } catch (error) {
      console.error('Error fetching survey:', error)
      setError('Failed to load survey')
    } finally {
      setLoading(false)
    }
  }, [surveyId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return <Circle className="h-4 w-4" />
      case 'checkbox':
        return <CheckCircle className="h-4 w-4" />
      case 'text':
        return <FileText className="h-4 w-4" />
      case 'rating':
        return <Star className="h-4 w-4" />
      case 'yes_no':
        return <CheckCircle className="h-4 w-4" />
      case 'date_time':
        return <Calendar className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
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
            <h1 className="text-2xl font-bold">{survey.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{survey.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(survey.status)}
          <Button onClick={onEdit}>
            Edit Survey
          </Button>
        </div>
      </div>

      {/* Survey Details */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Points Reward</p>
                <p className="text-lg font-bold">{survey.points_reward}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Est. Time</p>
                <p className="text-lg font-bold">{survey.estimated_completion_time} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Completions</p>
                <p className="text-lg font-bold">0</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm">{formatDate(survey.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({survey.questions?.length || 0})</CardTitle>
          <CardDescription>
            {survey.questions?.length || 0} questions in this survey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!survey.questions || survey.questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No questions added to this survey yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {survey.questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getQuestionTypeIcon(question.question_type)}
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {getQuestionTypeLabel(question.question_type)}
                        </span>
                        {question.is_required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <h3 className="font-medium mb-2">{question.question_text}</h3>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="w-4 h-4 border rounded-full flex items-center justify-center">
                                {question.question_type === 'checkbox' ? (
                                  <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                                ) : (
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                )}
                              </div>
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.validation_rules && Object.keys(question.validation_rules).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Validation:</span> {JSON.stringify(question.validation_rules)}
                        </div>
                      )}
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