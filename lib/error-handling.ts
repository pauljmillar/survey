export enum ErrorType {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Points & Balance
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_POINTS_AMOUNT = 'INVALID_POINTS_AMOUNT',
  POINTS_ALREADY_AWARDED = 'POINTS_ALREADY_AWARDED',
  
  // Survey Related
  SURVEY_NOT_FOUND = 'SURVEY_NOT_FOUND',
  SURVEY_ALREADY_COMPLETED = 'SURVEY_ALREADY_COMPLETED',
  SURVEY_NOT_QUALIFIED = 'SURVEY_NOT_QUALIFIED',
  SURVEY_EXPIRED = 'SURVEY_EXPIRED',
  
  // Redemption Related
  OFFER_NOT_FOUND = 'OFFER_NOT_FOUND',
  OFFER_EXPIRED = 'OFFER_EXPIRED',
  REDEMPTION_FAILED = 'REDEMPTION_FAILED',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // System Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Profile & User
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  INVALID_PROFILE_DATA = 'INVALID_PROFILE_DATA',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export interface AppError {
  type: ErrorType
  message: string
  userMessage: string
  code?: string
  details?: Record<string, any>
  recoverable: boolean
  retryable: boolean
  timestamp: Date
}

export class ErrorHandler {
  static createError(
    type: ErrorType,
    message: string,
    userMessage?: string,
    details?: Record<string, any>
  ): AppError {
    return {
      type,
      message,
      userMessage: userMessage || this.getDefaultUserMessage(type),
      details,
      recoverable: this.isRecoverable(type),
      retryable: this.isRetryable(type),
      timestamp: new Date()
    }
  }

  static getDefaultUserMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.UNAUTHORIZED]: 'Please sign in to continue',
      [ErrorType.FORBIDDEN]: 'You don\'t have permission to perform this action',
      [ErrorType.INVALID_CREDENTIALS]: 'Invalid email or password',
      [ErrorType.INSUFFICIENT_BALANCE]: 'You don\'t have enough points for this redemption',
      [ErrorType.INVALID_POINTS_AMOUNT]: 'Invalid points amount specified',
      [ErrorType.POINTS_ALREADY_AWARDED]: 'Points have already been awarded for this survey',
      [ErrorType.SURVEY_NOT_FOUND]: 'Survey not found or no longer available',
      [ErrorType.SURVEY_ALREADY_COMPLETED]: 'You have already completed this survey',
      [ErrorType.SURVEY_NOT_QUALIFIED]: 'You don\'t qualify for this survey',
      [ErrorType.SURVEY_EXPIRED]: 'This survey has expired',
      [ErrorType.OFFER_NOT_FOUND]: 'Offer not found or no longer available',
      [ErrorType.OFFER_EXPIRED]: 'This offer has expired',
      [ErrorType.REDEMPTION_FAILED]: 'Redemption failed. Please try again',
      [ErrorType.VALIDATION_ERROR]: 'Please check your input and try again',
      [ErrorType.INVALID_INPUT]: 'Invalid input provided',
      [ErrorType.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields',
      [ErrorType.NETWORK_ERROR]: 'Network connection error. Please check your internet connection',
      [ErrorType.SERVER_ERROR]: 'Server error. Please try again later',
      [ErrorType.DATABASE_ERROR]: 'Database error. Please try again later',
      [ErrorType.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again',
      [ErrorType.PROFILE_NOT_FOUND]: 'Profile not found',
      [ErrorType.INVALID_PROFILE_DATA]: 'Invalid profile data provided',
      [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again',
      [ErrorType.TIMEOUT_ERROR]: 'Request timed out. Please try again'
    }
    return messages[type] || 'An error occurred'
  }

  static isRecoverable(type: ErrorType): boolean {
    const recoverableTypes = [
      ErrorType.INSUFFICIENT_BALANCE,
      ErrorType.VALIDATION_ERROR,
      ErrorType.INVALID_INPUT,
      ErrorType.MISSING_REQUIRED_FIELD,
      ErrorType.NETWORK_ERROR,
      ErrorType.RATE_LIMIT_EXCEEDED,
      ErrorType.TIMEOUT_ERROR
    ]
    return recoverableTypes.includes(type)
  }

  static isRetryable(type: ErrorType): boolean {
    const retryableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.SERVER_ERROR,
      ErrorType.DATABASE_ERROR,
      ErrorType.RATE_LIMIT_EXCEEDED,
      ErrorType.TIMEOUT_ERROR
    ]
    return retryableTypes.includes(type)
  }

  static getRecoveryAction(type: ErrorType): string {
    const actions: Record<ErrorType, string> = {
      [ErrorType.INSUFFICIENT_BALANCE]: 'Earn more points by completing surveys',
      [ErrorType.VALIDATION_ERROR]: 'Please check your input and try again',
      [ErrorType.INVALID_INPUT]: 'Please check your input and try again',
      [ErrorType.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields',
      [ErrorType.NETWORK_ERROR]: 'Check your internet connection and try again',
      [ErrorType.RATE_LIMIT_EXCEEDED]: 'Wait a moment and try again',
      [ErrorType.TIMEOUT_ERROR]: 'Try again in a moment',
      [ErrorType.UNAUTHORIZED]: 'Please sign in to continue',
      [ErrorType.FORBIDDEN]: 'Contact support if you believe this is an error',
      [ErrorType.INVALID_CREDENTIALS]: 'Check your email and password',
      [ErrorType.INVALID_POINTS_AMOUNT]: 'Enter a valid points amount',
      [ErrorType.POINTS_ALREADY_AWARDED]: 'Check your activity log for points',
      [ErrorType.SURVEY_NOT_FOUND]: 'Browse other available surveys',
      [ErrorType.SURVEY_ALREADY_COMPLETED]: 'Browse other available surveys',
      [ErrorType.SURVEY_NOT_QUALIFIED]: 'Complete your profile to qualify for more surveys',
      [ErrorType.SURVEY_EXPIRED]: 'Browse other available surveys',
      [ErrorType.OFFER_NOT_FOUND]: 'Browse other available offers',
      [ErrorType.OFFER_EXPIRED]: 'Browse other available offers',
      [ErrorType.REDEMPTION_FAILED]: 'Try again or contact support',
      [ErrorType.SERVER_ERROR]: 'Try again later or contact support',
      [ErrorType.DATABASE_ERROR]: 'Try again later or contact support',
      [ErrorType.PROFILE_NOT_FOUND]: 'Complete your profile setup',
      [ErrorType.INVALID_PROFILE_DATA]: 'Please provide valid profile information',
      [ErrorType.UNKNOWN_ERROR]: 'Try again or contact support'
    }
    return actions[type] || 'Please try again'
  }

  static parseApiError(response: Response, data?: any): AppError {
    if (!response.ok) {
      switch (response.status) {
        case 401:
          return this.createError(ErrorType.UNAUTHORIZED, 'Authentication required')
        case 403:
          return this.createError(ErrorType.FORBIDDEN, 'Access denied')
        case 400:
          if (data?.error?.includes('insufficient')) {
            return this.createError(ErrorType.INSUFFICIENT_BALANCE, data.error)
          }
          if (data?.error?.includes('validation')) {
            return this.createError(ErrorType.VALIDATION_ERROR, data.error)
          }
          return this.createError(ErrorType.INVALID_INPUT, data?.error || 'Invalid request')
        case 404:
          return this.createError(ErrorType.SURVEY_NOT_FOUND, 'Resource not found')
        case 409:
          return this.createError(ErrorType.SURVEY_ALREADY_COMPLETED, 'Already completed')
        case 429:
          return this.createError(ErrorType.RATE_LIMIT_EXCEEDED, 'Too many requests')
        case 500:
          return this.createError(ErrorType.SERVER_ERROR, 'Server error')
        default:
          return this.createError(ErrorType.UNKNOWN_ERROR, 'Request failed')
      }
    }
    return this.createError(ErrorType.UNKNOWN_ERROR, 'Unknown error')
  }

  static handleNetworkError(error: any): AppError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createError(ErrorType.NETWORK_ERROR, 'Network connection failed')
    }
    if (error.name === 'AbortError') {
      return this.createError(ErrorType.TIMEOUT_ERROR, 'Request timed out')
    }
    return this.createError(ErrorType.UNKNOWN_ERROR, error.message || 'Network error')
  }
} 