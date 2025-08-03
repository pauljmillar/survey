import { useEffect, useState } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { Card } from '@/components/ui/card'
import { MobileSpinner } from '@/components/ui/mobile-loading'

interface Redemption {
  id: string
  points_spent: number
  status: string
  redemption_date: string
  merchant_offers: {
    id: string
    title: string
    description?: string
    merchant_name: string
  }
}

export function RealTimeRedemptions() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { isConnected, error } = useRealtime(
    { enableRedemptions: true },
    {
      onRedemptionUpdate: (data) => {
        setRedemptions(prev => [data, ...prev.slice(0, 49)]) // Keep last 50 redemptions
      },
    }
  )

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/redemptions')
        if (response.ok) {
          const data = await response.json()
          setRedemptions(data)
        }
      } catch (err) {
        console.error('Failed to fetch initial redemption data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <MobileSpinner size="sm" />
          <span className="text-sm text-muted-foreground">Loading redemptions...</span>
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
        <h3 className="text-lg font-semibold">Real-time Redemptions</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {redemptions.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No redemptions yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {redemptions.map((redemption) => (
            <Card key={redemption.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">
                      {redemption.merchant_offers.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {redemption.merchant_offers.merchant_name}
                    </p>
                    {redemption.merchant_offers.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {redemption.merchant_offers.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-4">
                    <span className="text-sm font-medium text-primary">
                      -{redemption.points_spent} pts
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(redemption.status)}`}>
                      {redemption.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Redeemed: {formatDate(redemption.redemption_date)}</span>
                  <span>ID: {redemption.id.slice(0, 8)}...</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 