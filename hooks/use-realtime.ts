import { useEffect, useRef, useState } from 'react'
import { useAuth } from './use-auth'
import {
  subscribeToPointsBalance,
  subscribeToActivityFeed,
  subscribeToSurveyAvailability,
  subscribeToSurveyQualifications,
  subscribeToRedemptions,
  handleSubscriptionError,
  cleanupSubscriptions,
} from '@/lib/realtime'

interface UseRealtimeOptions {
  enablePointsBalance?: boolean
  enableActivityFeed?: boolean
  enableSurveyAvailability?: boolean
  enableSurveyQualifications?: boolean
  enableRedemptions?: boolean
}

interface UseRealtimeReturn {
  isConnected: boolean
  error: string | null
}

export function useRealtime(
  options: UseRealtimeOptions = {},
  callbacks: {
    onPointsBalanceUpdate?: (data: { points_balance: number; total_points_earned: number; total_points_redeemed: number }) => void
    onActivityUpdate?: (data: { id: string; activity_type: string; description: string; metadata?: Record<string, any>; created_at: string }) => void
    onSurveyAvailabilityUpdate?: (data: { id: string; title: string; description?: string; points_reward: number; estimated_completion_time: number; status: string; created_at: string }) => void
    onSurveyQualificationUpdate?: (data: { survey_id: string; is_qualified: boolean }) => void
    onRedemptionUpdate?: (data: { id: string; points_spent: number; status: string; redemption_date: string; merchant_offers: { id: string; title: string; description?: string; merchant_name: string } }) => void
  } = {}
): UseRealtimeReturn {
  const { user, isSignedIn } = useAuth()
  const unsubscribeRefs = useRef<Array<() => void>>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn || !user) {
      // Clean up existing subscriptions
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe())
      unsubscribeRefs.current = []
      setIsConnected(false)
      return
    }

    const unsubscribeFunctions: Array<() => void> = []

    try {
      // Subscribe to points balance updates
      if (options.enablePointsBalance && callbacks.onPointsBalanceUpdate) {
        const unsubscribe = subscribeToPointsBalance(
          user.id,
          callbacks.onPointsBalanceUpdate
        )
        unsubscribeFunctions.push(unsubscribe)
      }

      // Subscribe to activity feed updates
      if (options.enableActivityFeed && callbacks.onActivityUpdate) {
        const unsubscribe = subscribeToActivityFeed(
          user.id,
          callbacks.onActivityUpdate
        )
        unsubscribeFunctions.push(unsubscribe)
      }

      // Subscribe to survey availability updates
      if (options.enableSurveyAvailability && callbacks.onSurveyAvailabilityUpdate) {
        const unsubscribe = subscribeToSurveyAvailability(
          callbacks.onSurveyAvailabilityUpdate
        )
        unsubscribeFunctions.push(unsubscribe)
      }

      // Subscribe to survey qualification updates
      if (options.enableSurveyQualifications && callbacks.onSurveyQualificationUpdate) {
        const unsubscribe = subscribeToSurveyQualifications(
          user.id,
          callbacks.onSurveyQualificationUpdate
        )
        unsubscribeFunctions.push(unsubscribe)
      }

      // Subscribe to redemption updates
      if (options.enableRedemptions && callbacks.onRedemptionUpdate) {
        const unsubscribe = subscribeToRedemptions(
          user.id,
          callbacks.onRedemptionUpdate
        )
        unsubscribeFunctions.push(unsubscribe)
      }

      unsubscribeRefs.current = unsubscribeFunctions
      setIsConnected(true)
      setError(null)
    } catch (err) {
      handleSubscriptionError(err)
      setError('Failed to establish real-time connection')
      setIsConnected(false)
    }

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
      unsubscribeRefs.current = []
      setIsConnected(false)
    }
  }, [
    isSignedIn,
    user?.id,
    options.enablePointsBalance,
    options.enableActivityFeed,
    options.enableSurveyAvailability,
    options.enableSurveyQualifications,
    options.enableRedemptions,
    callbacks.onPointsBalanceUpdate,
    callbacks.onActivityUpdate,
    callbacks.onSurveyAvailabilityUpdate,
    callbacks.onSurveyQualificationUpdate,
    callbacks.onRedemptionUpdate,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe())
      cleanupSubscriptions()
    }
  }, [])

  return { isConnected, error }
} 