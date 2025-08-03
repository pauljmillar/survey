'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'

interface PointsData {
  points_balance: number
  total_points_earned: number
  total_points_redeemed: number
  last_updated: string
}

interface PointsDisplayProps {
  variant?: 'card' | 'compact' | 'badge' | 'hero'
  showDetails?: boolean
  showTrends?: boolean
  refreshInterval?: number
  className?: string
}

export function PointsDisplay({ 
  variant = 'card', 
  showDetails = false,
  showTrends = false,
  refreshInterval = 30000, // 30 seconds default - now used as fallback
  className = ''
}: PointsDisplayProps) {
  const { user, isSignedIn } = useAuth()
  const [pointsData, setPointsData] = useState<PointsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchPointsData = async () => {
    if (!isSignedIn) return

    try {
      const response = await fetch('/api/points/balance')
      if (response.ok) {
        const data = await response.json()
        setPointsData(data)
        setLastUpdated(new Date())
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load points balance')
      }
    } catch (error) {
      console.error('Error fetching points:', error)
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscription for points balance updates
  const { isConnected: isRealtimeConnected } = useRealtime(
    { enablePointsBalance: true },
    {
      onPointsBalanceUpdate: (data) => {
        setPointsData({
          points_balance: data.points_balance,
          total_points_earned: data.total_points_earned,
          total_points_redeemed: data.total_points_redeemed,
        })
        setLastUpdated(new Date())
        setError(null)
      },
    }
  )

  // Initial load
  useEffect(() => {
    fetchPointsData()
  }, [isSignedIn])

  // Fallback polling if real-time connection fails
  useEffect(() => {
    if (!isSignedIn || !refreshInterval || isRealtimeConnected) return

    const interval = setInterval(fetchPointsData, refreshInterval)
    return () => clearInterval(interval)
  }, [isSignedIn, refreshInterval, isRealtimeConnected])

  // Format points with commas and currency symbol
  const formatPoints = (points: number): string => {
    return points.toLocaleString()
  }

  // Calculate earning efficiency
  const getEarningRate = (): string => {
    if (!pointsData || pointsData.total_points_earned === 0) return 'N/A'
    const redeemRate = (pointsData.total_points_redeemed / pointsData.total_points_earned) * 100
    return `${(100 - redeemRate).toFixed(0)}% saved`
  }

  // Loading state
  if (loading) {
    switch (variant) {
      case 'compact':
        return (
          <div className={`flex items-center space-x-2 ${className}`}>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        )
      case 'badge':
        return <Skeleton className={`h-6 w-20 rounded-full ${className}`} />
      case 'hero':
        return (
          <div className={`text-center ${className}`}>
            <Skeleton className="h-12 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        )
      default:
        return (
          <Card className={`p-6 ${className}`}>
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-40" />
          </Card>
        )
    }
  }

  // Error state
  if (error) {
    switch (variant) {
      case 'compact':
        return (
          <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
            <span className="text-sm">⚠️ Error loading points</span>
          </div>
        )
      case 'badge':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-600 ${className}`}>
            Error
          </span>
        )
      case 'hero':
        return (
          <div className={`text-center text-red-600 ${className}`}>
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-sm">Error loading points</p>
          </div>
        )
      default:
        return (
          <Card className={`p-6 border-red-200 ${className}`}>
            <div className="text-center text-red-600">
              <div className="text-2xl mb-2">⚠️</div>
              <p className="font-medium">Error loading points</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
              <button 
                onClick={fetchPointsData}
                className="mt-3 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </Card>
        )
    }
  }

  // No data state
  if (!pointsData) {
    return (
      <div className={`text-gray-500 ${className}`}>
        <span>No points data available</span>
      </div>
    )
  }

  // Render variants
  switch (variant) {
    case 'compact':
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="flex items-center space-x-1">
            <span className="text-blue-600 font-semibold">$</span>
            <span className="font-semibold text-gray-900">
              {formatPoints(pointsData.points_balance)}
            </span>
          </div>
          {showDetails && (
            <span className="text-sm text-gray-500">
              points
            </span>
          )}
        </div>
      )

    case 'badge':
      return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 ${className}`}>
          <span className="mr-1">$</span>
          {formatPoints(pointsData.points_balance)}
        </span>
      )

    case 'hero':
      return (
        <div className={`text-center ${className}`}>
          <div className="text-4xl font-bold text-blue-600 mb-2">
            ${formatPoints(pointsData.points_balance)}
          </div>
          <p className="text-lg text-gray-600">Available Points</p>
          {showDetails && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-green-600">
                  ${formatPoints(pointsData.total_points_earned)}
                </div>
                <div className="text-gray-500">Total Earned</div>
              </div>
              <div>
                <div className="font-semibold text-purple-600">
                  ${formatPoints(pointsData.total_points_redeemed)}
                </div>
                <div className="text-gray-500">Total Redeemed</div>
              </div>
            </div>
          )}
          {showTrends && (
            <div className="mt-3 text-sm text-gray-600">
              {getEarningRate()}
            </div>
          )}
        </div>
      )

    default: // card variant
      return (
        <Card className={`p-6 ${className}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Points Balance</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">$</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {formatPoints(pointsData.points_balance)}
            </div>
            <p className="text-sm text-gray-600">Available to redeem</p>
          </div>

          {showDetails && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Earned</span>
                <span className="font-semibold text-green-600">
                  +{formatPoints(pointsData.total_points_earned)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Redeemed</span>
                <span className="font-semibold text-purple-600">
                  -{formatPoints(pointsData.total_points_redeemed)}
                </span>
              </div>
              {showTrends && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Saving Rate</span>
                  <span className="font-semibold text-blue-600">
                    {getEarningRate()}
                  </span>
                </div>
              )}
            </div>
          )}

          {lastUpdated && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          )}
        </Card>
      )
  }
}

// Convenience components for specific use cases
export function PointsBalance({ className }: { className?: string }) {
  return <PointsDisplay variant="compact" className={className} />
}

export function PointsBadge({ className }: { className?: string }) {
  return <PointsDisplay variant="badge" className={className} />
}

export function PointsHero({ showDetails = true, showTrends = true, className }: { 
  showDetails?: boolean
  showTrends?: boolean
  className?: string 
}) {
  return (
    <PointsDisplay 
      variant="hero" 
      showDetails={showDetails}
      showTrends={showTrends}
      className={className} 
    />
  )
}

export function PointsCard({ 
  showDetails = true, 
  showTrends = false,
  refreshInterval = 30000,
  className 
}: { 
  showDetails?: boolean
  showTrends?: boolean
  refreshInterval?: number
  className?: string 
}) {
  return (
    <PointsDisplay 
      variant="card" 
      showDetails={showDetails}
      showTrends={showTrends}
      refreshInterval={refreshInterval}
      className={className} 
    />
  )
} 