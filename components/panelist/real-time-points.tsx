import { useEffect, useState } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { PointsCard, PointsHero } from './points-display'
import { Card } from '@/components/ui/card'
import { MobileSpinner } from '@/components/ui/mobile-loading'

interface RealTimePointsData {
  points_balance: number
  total_points_earned: number
  total_points_redeemed: number
}

export function RealTimePoints() {
  const [pointsData, setPointsData] = useState<RealTimePointsData>({
    points_balance: 0,
    total_points_earned: 0,
    total_points_redeemed: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const { isConnected, error } = useRealtime(
    { enablePointsBalance: true },
    {
      onPointsBalanceUpdate: (data) => {
        setPointsData(data)
        setIsLoading(false)
      },
    }
  )

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/points/balance')
        if (response.ok) {
          const data = await response.json()
          setPointsData(data)
        }
      } catch (err) {
        console.error('Failed to fetch initial points data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <MobileSpinner size="sm" />
          <span className="text-sm text-muted-foreground">Loading points...</span>
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
        <h3 className="text-lg font-semibold">Real-time Points</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <PointsHero />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PointsCard
          showDetails={true}
          showTrends={false}
        />
        <PointsCard
          showDetails={true}
          showTrends={false}
        />
      </div>
    </div>
  )
} 