import { useEffect, useState } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MobileSpinner } from '@/components/ui/mobile-loading'

interface Survey {
  id: string
  title: string
  description?: string
  points_reward: number
  estimated_completion_time: number
  status: string
  created_at: string
  is_qualified?: boolean
}

export function RealTimeSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { isConnected, error } = useRealtime(
    { 
      enableSurveyAvailability: true,
      enableSurveyQualifications: true 
    },
    {
      onSurveyAvailabilityUpdate: (data) => {
        setSurveys(prev => {
          const existing = prev.find(s => s.id === data.id)
          if (existing) {
            return prev.map(s => s.id === data.id ? { ...s, ...data } : s)
          } else {
            return [...prev, data]
          }
        })
      },
      onSurveyQualificationUpdate: (data) => {
        setSurveys(prev => 
          prev.map(s => s.id === data.survey_id ? { ...s, is_qualified: data.is_qualified } : s)
        )
      },
    }
  )

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/surveys')
        if (response.ok) {
          const data = await response.json()
          setSurveys(data)
        }
      } catch (err) {
        console.error('Failed to fetch initial survey data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const handleSurveyComplete = async (surveyId: string) => {
    try {
      const response = await fetch('/api/surveys/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId }),
      })
      
      if (response.ok) {
        // Survey will be updated via real-time subscription
        console.log('Survey completed successfully')
      }
    } catch (err) {
      console.error('Failed to complete survey:', err)
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <MobileSpinner size="sm" />
          <span className="text-sm text-muted-foreground">Loading surveys...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">Connection Error</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-time Surveys</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {surveys.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No surveys available</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey) => (
            <Card key={survey.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{survey.title}</h4>
                    {survey.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {survey.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-sm font-medium text-primary">
                      {survey.points_reward} pts
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(survey.estimated_completion_time)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      survey.is_qualified 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {survey.is_qualified ? 'Qualified' : 'Not Qualified'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      survey.status === 'active' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {survey.status}
                    </span>
                  </div>
                  
                  {survey.is_qualified && survey.status === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => handleSurveyComplete(survey.id)}
                    >
                      Complete Survey
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 