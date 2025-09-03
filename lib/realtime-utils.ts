import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Connection monitoring
export class RealtimeConnectionManager {
  private static instance: RealtimeConnectionManager
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second

  private constructor() {}

  static getInstance(): RealtimeConnectionManager {
    if (!RealtimeConnectionManager.instance) {
      RealtimeConnectionManager.instance = new RealtimeConnectionManager()
    }
    return RealtimeConnectionManager.instance
  }

  getConnectionStatus() {
    return this.connectionStatus
  }

  setConnectionStatus(status: 'connected' | 'disconnected' | 'connecting') {
    this.connectionStatus = status
    this.notifyStatusChange(status)
  }

  private notifyStatusChange(status: string) {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('realtime-status-change', { detail: { status } }))
  }

  async attemptReconnect(): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return false
    }

    this.setConnectionStatus('connecting')
    this.reconnectAttempts++

    try {
      // Test connection by subscribing to a test channel
      const testChannel = supabase.channel('test-connection')
      await testChannel.subscribe()
      testChannel.unsubscribe()

      this.setConnectionStatus('connected')
      this.reconnectAttempts = 0
      this.reconnectDelay = 1000 // Reset delay
      return true
    } catch (error) {
      console.error('Reconnection attempt failed:', error)
      this.setConnectionStatus('disconnected')
      
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000)
      
      setTimeout(() => {
        this.attemptReconnect()
      }, this.reconnectDelay)

      return false
    }
  }
}

// Performance optimization utilities
export class RealtimePerformanceOptimizer {
  private static instance: RealtimePerformanceOptimizer
  private updateQueue: Map<string, any> = new Map()
  private batchTimeout: NodeJS.Timeout | null = null
  private batchDelay = 100 // ms

  private constructor() {}

  static getInstance(): RealtimePerformanceOptimizer {
    if (!RealtimePerformanceOptimizer.instance) {
      RealtimePerformanceOptimizer.instance = new RealtimePerformanceOptimizer()
    }
    return RealtimePerformanceOptimizer.instance
  }

  // Debounce updates to prevent excessive re-renders
  debounceUpdate(key: string, data: any, callback: (data: any) => void) {
    this.updateQueue.set(key, data)

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    this.batchTimeout = setTimeout(() => {
      this.updateQueue.forEach((data, key) => {
        callback(data)
      })
      this.updateQueue.clear()
      this.batchTimeout = null
    }, this.batchDelay)
  }

  // Throttle updates to limit frequency
  throttleUpdate(key: string, data: any, callback: (data: any) => void, limit: number = 1000) {
    const now = Date.now()
    const lastUpdate = this.lastUpdateTimes.get(key) || 0

    if (now - lastUpdate >= limit) {
      callback(data)
      this.lastUpdateTimes.set(key, now)
    }
  }

  private lastUpdateTimes: Map<string, number> = new Map()
}

// Error handling utilities
export class RealtimeErrorHandler {
  private static instance: RealtimeErrorHandler
  private errorCount = 0
  private maxErrors = 10
  private errorWindow = 60000 // 1 minute

  private constructor() {}

  static getInstance(): RealtimeErrorHandler {
    if (!RealtimeErrorHandler.instance) {
      RealtimeErrorHandler.instance = new RealtimeErrorHandler()
    }
    return RealtimeErrorHandler.instance
  }

  handleError(error: any, context: string) {
    this.errorCount++
    
    console.error(`Realtime error in ${context}:`, error)

    // If too many errors in a short time, disable real-time
    if (this.errorCount > this.maxErrors) {
      console.warn('Too many real-time errors, disabling real-time updates')
      this.disableRealtime()
    }

    // Reset error count after window
    setTimeout(() => {
      this.errorCount = Math.max(0, this.errorCount - 1)
    }, this.errorWindow)

    return {
      type: 'realtime_error',
      context,
      message: error.message || 'Unknown real-time error',
      timestamp: new Date().toISOString(),
    }
  }

  private disableRealtime() {
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('realtime-disabled', {
      detail: { reason: 'too_many_errors' }
    }))
  }

  resetErrorCount() {
    this.errorCount = 0
  }
}

// Memory management utilities
export class RealtimeMemoryManager {
  private static instance: RealtimeMemoryManager
  private subscriptions: Map<string, () => void> = new Map()
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map()
  private maxCacheAge = 300000 // 5 minutes

  private constructor() {
    // Clean up old cache entries periodically
    setInterval(() => {
      this.cleanupCache()
    }, 60000) // Every minute
  }

  static getInstance(): RealtimeMemoryManager {
    if (!RealtimeMemoryManager.instance) {
      RealtimeMemoryManager.instance = new RealtimeMemoryManager()
    }
    return RealtimeMemoryManager.instance
  }

  registerSubscription(id: string, unsubscribe: () => void) {
    this.subscriptions.set(id, unsubscribe)
  }

  unregisterSubscription(id: string) {
    const unsubscribe = this.subscriptions.get(id)
    if (unsubscribe) {
      unsubscribe()
      this.subscriptions.delete(id)
    }
  }

  cleanupAllSubscriptions() {
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions.clear()
  }

  cacheData(key: string, data: any) {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  getCachedData(key: string) {
    const cached = this.dataCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.maxCacheAge) {
      return cached.data
    }
    return null
  }

  private cleanupCache() {
    const now = Date.now()
    for (const [key, value] of this.dataCache.entries()) {
      if (now - value.timestamp > this.maxCacheAge) {
        this.dataCache.delete(key)
      }
    }
  }

  getMemoryUsage() {
    return {
      subscriptions: this.subscriptions.size,
      cacheEntries: this.dataCache.size,
    }
  }
}

// Utility functions
export const realtimeUtils = {
  // Format real-time data for display
  formatRealtimeData: (data: any, type: string) => {
    switch (type) {
      case 'points':
        return {
          points_balance: data.points_balance || 0,
          total_points_earned: data.total_points_earned || 0,
          total_points_redeemed: data.total_points_redeemed || 0,
        }
      case 'activity':
        return {
          id: data.id,
          activity_type: data.activity_type,
          description: data.description,
          metadata: data.metadata,
          created_at: data.created_at,
        }
      case 'survey':
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          points_reward: data.points_reward,
          estimated_completion_time: data.estimated_completion_time,
          status: data.status,
          created_at: data.created_at,
        }
      default:
        return data
    }
  },

  // Validate real-time data
  validateRealtimeData: (data: any, type: string): boolean => {
    if (!data || typeof data !== 'object') return false

    switch (type) {
      case 'points':
        return typeof data.points_balance === 'number' &&
               typeof data.total_points_earned === 'number' &&
               typeof data.total_points_redeemed === 'number'
      case 'activity':
        return typeof data.id === 'string' &&
               typeof data.activity_type === 'string' &&
               typeof data.description === 'string' &&
               typeof data.created_at === 'string'
      case 'survey':
        return typeof data.id === 'string' &&
               typeof data.title === 'string' &&
               typeof data.points_reward === 'number' &&
               typeof data.estimated_completion_time === 'number'
      default:
        return true
    }
  },

  // Create unique subscription ID
  createSubscriptionId: (type: string, userId: string, additional?: string) => {
    return `${type}_${userId}_${additional || Date.now()}`
  },

  // Check if data has changed
  hasDataChanged: (oldData: any, newData: any): boolean => {
    return JSON.stringify(oldData) !== JSON.stringify(newData)
  },
}

const realtimeModule = {
  RealtimeConnectionManager,
  RealtimePerformanceOptimizer,
  RealtimeErrorHandler,
  RealtimeMemoryManager,
  realtimeUtils,
}

export default realtimeModule 