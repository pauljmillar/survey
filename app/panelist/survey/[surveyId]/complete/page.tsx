'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  Award, 
  ArrowRight,
  Home
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SurveyCompletionPage({ params }: { params: { surveyId: string } }) {
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSurveyDetails()
  }, [params.surveyId])

  const fetchSurveyDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/surveys/${params.surveyId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch survey details')
      }
      
      const data = await response.json()
      setSurvey(data.survey)
    } catch (error) {
      console.error('Error fetching survey details:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className="space-y-6 pt-12">
      {/* Success Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Survey Completed!</h1>
        <p className="text-muted-foreground text-lg">
          Thank you for completing the survey. Your responses have been recorded.
        </p>
      </div>

      {/* Points Earned */}
      {survey && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Points Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">
                +{survey.points_reward}
              </p>
              <p className="text-muted-foreground">
                points have been added to your balance
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Survey Details */}
      {survey && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Survey Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Survey Title</p>
              <p className="font-medium">{survey.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{survey.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estimated Time</p>
              <p className="text-sm">{survey.estimated_completion_time} minutes</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => router.push('/panelist')}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button 
          variant="outline"
          onClick={() => router.push('/panelist/rewards')}
          className="flex items-center gap-2"
        >
          View Rewards
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-muted-foreground max-w-md mx-auto">
        <p>
          Your survey responses have been saved and your points have been credited to your account. 
          You can now redeem your points for rewards in the rewards section.
        </p>
      </div>
    </div>
  )
} 