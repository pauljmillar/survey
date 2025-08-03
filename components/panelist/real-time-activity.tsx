import { useEffect, useState } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { Card } from '@/components/ui/card'
import { MobileSpinner } from '@/components/ui/mobile-loading'

interface ActivityItem {
  id: string
  activity_type: string
  description: string
  metadata?: Record<string, any>
  created_at: string
}

export function RealTimeActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { isConnected, error } = useRealtime(
    { enableActivityFeed: true },
    {
      onActivityUpdate: (data) => {
        setActivities(prev => [data, ...prev.slice(0, 49)]) // Keep last 50 activities
      },
    }
  )

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/activity')
        if (response.ok) {
          const data = await response.json()
          setActivities(data)
        }
      } catch (err) {
        console.error('Failed to fetch initial activity data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'survey_completed':
        return '📊'
      case 'points_earned':
        return '💰'
      case 'redemption_made':
        return '🎁'
      case 'profile_updated':
        return '👤'
      default:
        return '📝'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <MobileSpinner size="sm" />
          <span className="text-sm text-muted-foreground">Loading activity...</span>
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
        <h3 className="text-lg font-semibold">Real-time Activity</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {activities.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No activity yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-2xl">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(activity.created_at)}
                  </p>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <span key={key} className="mr-2">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
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