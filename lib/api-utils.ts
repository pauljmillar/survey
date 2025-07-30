import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Standard API error responses
 */
export const ApiErrors = {
  UNAUTHORIZED: { error: 'Unauthorized', status: 401 },
  FORBIDDEN: { error: 'Forbidden', status: 403 },
  NOT_FOUND: { error: 'Not found', status: 404 },
  METHOD_NOT_ALLOWED: { error: 'Method not allowed', status: 405 },
  VALIDATION_ERROR: { error: 'Validation error', status: 400 },
  RATE_LIMITED: { error: 'Rate limit exceeded', status: 429 },
  INTERNAL_ERROR: { error: 'Internal server error', status: 500 },
} as const

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string | { error: string; status: number },
  details?: any
): NextResponse {
  if (typeof error === 'string') {
    return NextResponse.json({ error }, { status: 400 })
  }
  
  const response: any = { error: error.error }
  if (details) {
    response.details = details
  }
  
  return NextResponse.json(response, { status: error.status })
}

/**
 * Handle validation errors from Zod
 */
export function handleValidationError(error: ZodError): NextResponse {
  return createErrorResponse(
    ApiErrors.VALIDATION_ERROR,
    error.flatten()
  )
}

/**
 * Handle common API errors
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  if (error instanceof ZodError) {
    return handleValidationError(error)
  }
  
  if (error instanceof Error) {
    switch (error.message) {
      case 'Authentication required':
        return createErrorResponse(ApiErrors.UNAUTHORIZED)
      case 'Insufficient permissions':
        return createErrorResponse(ApiErrors.FORBIDDEN)
      case 'Rate limit exceeded':
        return createErrorResponse(ApiErrors.RATE_LIMITED)
      default:
        return createErrorResponse(ApiErrors.INTERNAL_ERROR)
    }
  }
  
  return createErrorResponse(ApiErrors.INTERNAL_ERROR)
}

/**
 * Pagination utilities
 */
export interface PaginationParams {
  limit: number
  offset: number
  page?: number
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Max 100 items
  const page = parseInt(searchParams.get('page') || '1')
  const offset = parseInt(searchParams.get('offset') || '0') || (page - 1) * limit
  
  return { limit, offset, page }
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams
) {
  const { limit, offset, page } = pagination
  const hasMore = offset + limit < total
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      page: page || Math.floor(offset / limit) + 1,
      totalPages,
      hasMore,
      hasPrevious: offset > 0,
    },
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .substring(0, 1000) // Limit length
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Safe JSON parsing
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Response headers for API endpoints
 */
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
} as const

/**
 * Create response with security headers
 */
export function createSecureResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: API_HEADERS,
  })
}

/**
 * CORS headers for cross-origin requests
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
} as const

/**
 * Handle CORS preflight requests
 */
export function handleCORS(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  })
}

/**
 * Log API request for monitoring
 */
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  duration?: number,
  status?: number
): void {
  const timestamp = new Date().toISOString()
  const logData = {
    timestamp,
    method,
    path,
    userId: userId || 'anonymous',
    duration: duration ? `${duration}ms` : undefined,
    status,
  }
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service (e.g., DataDog, LogRocket, etc.)
    console.log('API Request:', JSON.stringify(logData))
  } else {
    console.log('API Request:', logData)
  }
} 