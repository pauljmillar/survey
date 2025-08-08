'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Download, 
  Users, 
  Calendar, 
  Award,
  BarChart3,
  FileText
} from 'lucide-react'
import Link from 'next/link'

interface SurveyResultsProps {
  surveyId: string
  onBack: () => void
}

interface SurveyResponse {
  id: string
  completed_at: string
  points_earned: number
  response_data: any
  processed_response_data: any
  panelist: {
    user_id: string
    profile_data: any
  }
}

interface SurveyResultsData {
  survey: {
    id: string
    title: string
    description: string
    points_reward: number
    status: string
    created_at: string
  }
  response_count: number
  responses: SurveyResponse[]
  questions: Array<{
    id: string
    question_text: string
    question_type: string
  }>
}

export function SurveyResults({ surveyId, onBack }: SurveyResultsProps) {
  const [data, setData] = useState<SurveyResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResults()
  }, [surveyId])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/surveys/${surveyId}/responses`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch results')
      }
      
      const resultData = await response.json()
      setData(resultData)
    } catch (error) {
      console.error('Error fetching survey results:', error)
      setError(error instanceof Error ? error.message : 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!data) return

    // Create CSV content with question headers
    const headers = ['Response ID', 'Panelist Name', 'Email', 'Completed At', 'Points Earned']
    
    // Add question headers
    const questionHeaders = data.questions.map(q => q.question_text)
    const allHeaders = [...headers, ...questionHeaders]
    
    const csvRows = [
      allHeaders.join(','),
      ...data.responses.map(response => {
        const baseRow = [
          response.id,
          `${response.panelist.profile_data?.first_name || ''} ${response.panelist.profile_data?.last_name || ''}`.trim(),
          response.panelist.profile_data?.email || '',
          new Date(response.completed_at).toLocaleString(),
          response.points_earned.toString()
        ]
        
        // Add response values for each question
        const responseValues = data.questions.map(question => {
          const value = response.processed_response_data?.[question.question_text] || ''
          // Escape commas and quotes in CSV
          const escapedValue = typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          return escapedValue
        })
        
        return [...baseRow, ...responseValues].join(',')
      })
    ]
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${data.survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Surveys
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{data.survey.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">Survey Results</p>
          </div>
        </div>
        <Button onClick={exportCSV} className="bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{data.response_count}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">
                {data.responses.reduce((sum, r) => sum + r.points_earned, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Survey Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={data.survey.status === 'active' ? 'default' : 'secondary'}>
              {data.survey.status.charAt(0).toUpperCase() + data.survey.status.slice(1)}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm">{formatDate(data.survey.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Individual Responses
          </CardTitle>
          <CardDescription>
            Detailed view of all survey responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.responses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No responses yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.responses.map((response, index) => (
                <div key={response.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div>
                        <p className="font-medium">
                          {response.panelist.profile_data?.first_name && response.panelist.profile_data?.last_name
                            ? `${response.panelist.profile_data.first_name} ${response.panelist.profile_data.last_name}`
                            : response.panelist.profile_data?.email}
                        </p>
                        <p className="text-sm text-gray-500">{response.panelist.profile_data?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(response.completed_at)}</p>
                      <p className="font-medium text-green-600">+{response.points_earned} points</p>
                    </div>
                  </div>
                  
                  {response.processed_response_data && Object.keys(response.processed_response_data).length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-medium mb-2">Survey Responses:</h4>
                      <div className="space-y-3">
                        {data.questions.map(question => {
                          const responseValue = response.processed_response_data[question.question_text]
                          if (responseValue === undefined) return null
                          
                          return (
                            <div key={question.id} className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {question.question_text}
                              </p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {responseValue || 'No response'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 