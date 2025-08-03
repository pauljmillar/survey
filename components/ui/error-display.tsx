'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { Button } from './button'
import { AppError, ErrorType, ErrorHandler } from '@/lib/error-handling'

interface ErrorDisplayProps {
  error: AppError
  onRetry?: () => void
  onDismiss?: () => void
  onAction?: () => void
  showDetails?: boolean
  className?: string
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  onAction,
  showDetails = false,
  className = ''
}: ErrorDisplayProps) {
  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case ErrorType.INSUFFICIENT_BALANCE:
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case ErrorType.NETWORK_ERROR:
      case ErrorType.SERVER_ERROR:
      case ErrorType.DATABASE_ERROR:
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.INVALID_INPUT:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />
    }
  }

  const getErrorColor = (type: ErrorType) => {
    switch (type) {
      case ErrorType.INSUFFICIENT_BALANCE:
        return 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-900 dark:text-orange-100'
      case ErrorType.NETWORK_ERROR:
      case ErrorType.SERVER_ERROR:
      case ErrorType.DATABASE_ERROR:
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100'
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.INVALID_INPUT:
        return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-100'
      default:
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100'
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getErrorColor(error.type)} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {getErrorIcon(error.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium mb-1">
            {error.userMessage}
          </h3>
          {error.recoverable && (
            <p className="text-sm opacity-90 mb-3">
              {ErrorHandler.getRecoveryAction(error.type)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {error.retryable && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            )}
            {onAction && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAction}
                className="text-xs"
              >
                {error.type === ErrorType.INSUFFICIENT_BALANCE ? 'Earn Points' : 'Take Action'}
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {showDetails && error.details && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs opacity-75">
                Error Details
              </summary>
              <pre className="mt-2 text-xs bg-black/10 p-2 rounded overflow-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

interface ErrorToastProps {
  error: AppError
  onRetry?: () => void
  onDismiss: () => void
}

export function ErrorToast({ error, onRetry, onDismiss }: ErrorToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <ErrorDisplay
        error={error}
        onRetry={onRetry}
        onDismiss={onDismiss}
        className="shadow-lg"
      />
    </div>
  )
} 