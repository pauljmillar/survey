import { NextRequest } from 'next/server'

// Simple in-memory rate limiter (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

// Default rate limits
export const RATE_LIMITS = {
  // General API rate limit
  DEFAULT: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
  
  // Stricter limits for sensitive operations
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 20 }, // 20 requests per 15 minutes
  SURVEY_COMPLETION: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 completions per minute
  REDEMPTION: { windowMs: 60 * 1000, maxRequests: 3 }, // 3 redemptions per minute
  
  // Admin operations
  ADMIN: { windowMs: 60 * 1000, maxRequests: 50 }, // 50 requests per minute
} as const

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  error?: string
}

/**
 * Rate limit checker
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = `${identifier}`
  
  // Get or create rate limit entry
  let rateLimitEntry = rateLimitMap.get(key)
  
  // If no entry exists or window has expired, create new one
  if (!rateLimitEntry || now >= rateLimitEntry.resetTime) {
    rateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitMap.set(key, rateLimitEntry)
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: rateLimitEntry.resetTime,
    }
  }
  
  // Check if limit exceeded
  if (rateLimitEntry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: rateLimitEntry.resetTime,
      error: 'Rate limit exceeded',
    }
  }
  
  // Increment count
  rateLimitEntry.count++
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - rateLimitEntry.count,
    resetTime: rateLimitEntry.resetTime,
  }
}

/**
 * Get client identifier for rate limiting
 * @param request - Next.js request object
 * @param userId - Optional user ID for authenticated requests
 * @returns Unique identifier string
 */
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }
  
  // Try to get IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')
  
  return `ip:${ip || 'unknown'}`
}

/**
 * Apply rate limit to a request
 * @param request - Next.js request object
 * @param userId - Optional user ID
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function applyRateLimit(
  request: NextRequest,
  userId: string | undefined,
  config: RateLimitConfig
): RateLimitResult {
  const identifier = getClientIdentifier(request, userId)
  return checkRateLimit(identifier, config)
}

/**
 * Clean up expired rate limit entries (should be called periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now()
  
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(cleanupRateLimit, 5 * 60 * 1000)
} 