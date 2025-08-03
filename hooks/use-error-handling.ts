import { useState, useCallback } from 'react'
import { AppError, ErrorType, ErrorHandler } from '@/lib/error-handling'

interface UseErrorHandlingReturn {
  error: AppError | null
  setError: (error: AppError) => void
  clearError: () => void
  handleApiError: (response: Response, data?: any) => void
  handleNetworkError: (error: any) => void
  handleValidationError: (message: string, details?: Record<string, any>) => void
  handleInsufficientBalance: (required: number, current: number) => void
  isError: boolean
  isRecoverable: boolean
  isRetryable: boolean
}

export function useErrorHandling(): UseErrorHandlingReturn {
  const [error, setErrorState] = useState<AppError | null>(null)

  const setError = useCallback((error: AppError) => {
    setErrorState(error)
    console.error('Error occurred:', error)
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  const handleApiError = useCallback((response: Response, data?: any) => {
    const appError = ErrorHandler.parseApiError(response, data)
    setError(appError)
  }, [setError])

  const handleNetworkError = useCallback((error: any) => {
    const appError = ErrorHandler.handleNetworkError(error)
    setError(appError)
  }, [setError])

  const handleValidationError = useCallback((message: string, details?: Record<string, any>) => {
    const appError = ErrorHandler.createError(
      ErrorType.VALIDATION_ERROR,
      message,
      undefined,
      details
    )
    setError(appError)
  }, [setError])

  const handleInsufficientBalance = useCallback((required: number, current: number) => {
    const appError = ErrorHandler.createError(
      ErrorType.INSUFFICIENT_BALANCE,
      `Insufficient balance: required ${required}, current ${current}`,
      `You need ${required - current} more points for this redemption`,
      { required, current, shortfall: required - current }
    )
    setError(appError)
  }, [setError])

  return {
    error,
    setError,
    clearError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    handleInsufficientBalance,
    isError: error !== null,
    isRecoverable: error?.recoverable ?? false,
    isRetryable: error?.retryable ?? false,
  }
} 