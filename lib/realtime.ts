import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type RealtimeCallback<T> = (payload: T) => void

/**
 * Subscribe to real-time updates for panelist points balance
 */
export function subscribeToPointsBalance(
  panelistId: string,
  callback: RealtimeCallback<{ points_balance: number; total_points_earned: number; total_points_redeemed: number }>
) {
  const subscription = supabase
    .channel(`panelist_points_${panelistId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'panelist_profiles',
        filter: `id=eq.${panelistId}`,
      },
      (payload) => {
        if (payload.new) {
          callback({
            points_balance: payload.new.points_balance,
            total_points_earned: payload.new.total_points_earned,
            total_points_redeemed: payload.new.total_points_redeemed,
          })
        }
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Subscribe to real-time updates for activity feed
 */
export function subscribeToActivityFeed(
  userId: string,
  callback: RealtimeCallback<{
    id: string
    activity_type: string
    description: string
    metadata?: Record<string, any>
    created_at: string
  }>
) {
  const subscription = supabase
    .channel(`activity_feed_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_log',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          callback({
            id: payload.new.id,
            activity_type: payload.new.activity_type,
            description: payload.new.description,
            metadata: payload.new.metadata,
            created_at: payload.new.created_at,
          })
        }
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Subscribe to real-time updates for survey availability
 */
export function subscribeToSurveyAvailability(
  callback: RealtimeCallback<{
    id: string
    title: string
    description?: string
    points_reward: number
    estimated_completion_time: number
    status: string
    created_at: string
  }>
) {
  const subscription = supabase
    .channel('survey_availability')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'surveys',
        filter: 'status=eq.active',
      },
      (payload) => {
        if (payload.new) {
          callback({
            id: payload.new.id,
            title: payload.new.title,
            description: payload.new.description,
            points_reward: payload.new.points_reward,
            estimated_completion_time: payload.new.estimated_completion_time,
            status: payload.new.status,
            created_at: payload.new.created_at,
          })
        }
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Subscribe to real-time updates for survey qualifications
 */
export function subscribeToSurveyQualifications(
  panelistId: string,
  callback: RealtimeCallback<{
    survey_id: string
    is_qualified: boolean
  }>
) {
  const subscription = supabase
    .channel(`survey_qualifications_${panelistId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'survey_qualifications',
        filter: `panelist_id=eq.${panelistId}`,
      },
      (payload) => {
        if (payload.new) {
          callback({
            survey_id: payload.new.survey_id,
            is_qualified: payload.new.is_qualified,
          })
        }
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Subscribe to real-time updates for redemptions
 */
export function subscribeToRedemptions(
  panelistId: string,
  callback: RealtimeCallback<{
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
  }>
) {
  const subscription = supabase
    .channel(`redemptions_${panelistId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'redemptions',
        filter: `panelist_id=eq.${panelistId}`,
      },
      (payload) => {
        if (payload.new) {
          // Fetch the associated merchant offer details
          supabase
            .from('merchant_offers')
            .select('id, title, description, merchant_name')
            .eq('id', payload.new.offer_id)
            .single()
            .then(({ data: offer }) => {
              callback({
                id: payload.new.id,
                points_spent: payload.new.points_spent,
                status: payload.new.status,
                redemption_date: payload.new.redemption_date,
                merchant_offers: offer || {
                  id: '',
                  title: 'Unknown Offer',
                  description: '',
                  merchant_name: 'Unknown Merchant',
                },
              })
            })
        }
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Utility function to handle subscription errors
 */
export function handleSubscriptionError(error: any) {
  console.error('Real-time subscription error:', error)
  // In a production app, you might want to show a toast notification
  // or retry the subscription
}

/**
 * Clean up all subscriptions
 */
export function cleanupSubscriptions() {
  supabase.removeAllChannels()
} 