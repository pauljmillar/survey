'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'

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

interface SurveyImport {
  title: string
  description: string
  points_reward: number
  estimated_completion_time: number
  questions: Question[]
}

interface JsonUploadProps {
  onImport: (surveyData: SurveyImport) => void
  onCancel: () => void
}

export function JsonUpload({ onImport, onCancel }: JsonUploadProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [parsedData, setParsedData] = useState<SurveyImport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const validateAndParseJson = () => {
    setIsValidating(true)
    setError(null)
    setParsedData(null)

    try {
      const data = JSON.parse(jsonInput)
      
      // Validate required fields
      if (!data.title || typeof data.title !== 'string') {
        throw new Error('Survey title is required and must be a string')
      }
      
      if (!data.description || typeof data.description !== 'string') {
        throw new Error('Survey description is required and must be a string')
      }
      
      if (!data.points_reward || typeof data.points_reward !== 'number') {
        throw new Error('Points reward is required and must be a number')
      }
      
      if (!data.estimated_completion_time || typeof data.estimated_completion_time !== 'number') {
        throw new Error('Estimated completion time is required and must be a number')
      }
      
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Questions array is required')
      }
      
      if (data.questions.length === 0) {
        throw new Error('At least one question is required')
      }

      // Validate each question
      const validatedQuestions: Question[] = data.questions.map((q: any, index: number) => {
        if (!q.question_text || typeof q.question_text !== 'string') {
          throw new Error(`Question ${index + 1}: question_text is required and must be a string`)
        }
        
        if (!q.question_type || !['multiple_choice', 'text', 'rating', 'checkbox', 'yes_no', 'date_time'].includes(q.question_type)) {
          throw new Error(`Question ${index + 1}: question_type must be one of: multiple_choice, text, rating, checkbox, yes_no, date_time`)
        }
        
        if (typeof q.question_order !== 'number') {
          throw new Error(`Question ${index + 1}: question_order must be a number`)
        }
        
        if (typeof q.is_required !== 'boolean') {
          throw new Error(`Question ${index + 1}: is_required must be a boolean`)
        }

        // Validate options for multiple choice and checkbox
        if ((q.question_type === 'multiple_choice' || q.question_type === 'checkbox') && (!q.options || !Array.isArray(q.options) || q.options.length < 2)) {
          throw new Error(`Question ${index + 1}: options array with at least 2 items is required for ${q.question_type} questions`)
        }

        return {
          question_text: q.question_text,
          question_type: q.question_type,
          question_order: q.question_order,
          is_required: q.is_required,
          options: q.options,
          validation_rules: q.validation_rules || {}
        }
      })

      const surveyData: SurveyImport = {
        title: data.title,
        description: data.description,
        points_reward: data.points_reward,
        estimated_completion_time: data.estimated_completion_time,
        questions: validatedQuestions
      }

      setParsedData(surveyData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format')
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = () => {
    if (parsedData) {
      onImport(parsedData)
    }
  }

  const getExampleJson = () => {
    return JSON.stringify({
      title: "Customer Satisfaction Survey",
      description: "Help us improve our services by providing your feedback",
      points_reward: 100,
      estimated_completion_time: 5,
      questions: [
        {
          question_text: "How satisfied are you with our service?",
          question_type: "rating",
          question_order: 1,
          is_required: true,
          validation_rules: {
            min_value: 1,
            max_value: 5
          }
        },
        {
          question_text: "What aspects of our service could be improved?",
          question_type: "text",
          question_order: 2,
          is_required: false,
          validation_rules: {
            min_length: 10,
            max_length: 500
          }
        },
        {
          question_text: "Which of our features do you use most often?",
          question_type: "checkbox",
          question_order: 3,
          is_required: true,
          options: ["Feature A", "Feature B", "Feature C", "Feature D"],
          validation_rules: {
            min_selections: 1,
            max_selections: 3
          }
        },
        {
          question_text: "Would you recommend our service to others?",
          question_type: "yes_no",
          question_order: 4,
          is_required: true
        }
      ]
    }, null, 2)
  }

  const loadExample = () => {
    setJsonInput(getExampleJson())
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Survey from JSON
        </CardTitle>
        <CardDescription>
          Paste JSON data from an LLM or other source to quickly create a survey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* JSON Input */}
        <div>
          <Label htmlFor="json-input">Survey JSON Data</Label>
          <Textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your survey JSON data here..."
            className="mt-1 min-h-[200px] font-mono text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={validateAndParseJson} disabled={!jsonInput.trim() || isValidating}>
            {isValidating ? 'Validating...' : 'Validate & Preview'}
          </Button>
          <Button variant="outline" onClick={loadExample}>
            <FileText className="h-4 w-4 mr-1" />
            Load Example
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview */}
        {parsedData && !error && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                JSON is valid! Review the survey details below.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{parsedData.title}</CardTitle>
                <CardDescription>{parsedData.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Points Reward</Label>
                    <p className="text-lg font-semibold">{parsedData.points_reward}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Estimated Time</Label>
                    <p className="text-lg font-semibold">{parsedData.estimated_completion_time} min</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Questions ({parsedData.questions.length})</Label>
                  <div className="space-y-2 mt-2">
                    {parsedData.questions.map((question, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <Badge variant="outline" className="text-xs">
                          {question.question_type}
                        </Badge>
                        <span className="text-sm flex-1">{question.question_text}</span>
                        {question.is_required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <Button onClick={handleImport} className="w-full">
                    <Upload className="h-4 w-4 mr-1" />
                    Import Survey
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* JSON Format Help */}
        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-sm">Expected JSON Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-2">
              <p><strong>Required fields:</strong> title, description, points_reward, estimated_completion_time, questions</p>
              <p><strong>Question types:</strong> multiple_choice, text, rating, checkbox, yes_no, date_time</p>
              <p><strong>Question fields:</strong> question_text, question_type, question_order, is_required</p>
              <p><strong>Optional:</strong> options (for multiple_choice/checkbox), validation_rules</p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
} 