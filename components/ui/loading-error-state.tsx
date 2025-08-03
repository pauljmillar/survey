'use client'

import React from 'react'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { ErrorDisplay } from './error-display'
import { EmptyState } from './empty-state'
import { AppError } from '@/lib/error-handling'

interface LoadingErrorStateProps {
  loading: boolean
  error: AppError | null
  isEmpty: boolean
  emptyTitle?: string
  emptyMessage?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  onRetry?: () => void
  onDismiss?: () => void
  children: React.ReactNode
  className?: string
}

export function LoadingErrorState({
  loading,
  error,
  isEmpty,
  emptyTitle = 'No Data Available',
  emptyMessage = 'There are no items to display at the moment.',
  emptyActionLabel,
  onEmptyAction,
  onRetry,
  onDismiss,
  children,
  className = ''
}: LoadingErrorStateProps) {
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`py-4 ${className}`}>
        <ErrorDisplay
          error={error}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={`py-8 ${className}`}>
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    )
  }

  return <>{children}</>
}

interface AsyncDataStateProps<T> {
  data: T | null
  loading: boolean
  error: AppError | null
  isEmpty: (data: T) => boolean
  emptyTitle?: string
  emptyMessage?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  onRetry?: () => void
  onDismiss?: () => void
  children: (data: T) => React.ReactNode
  className?: string
}

export function AsyncDataState<T>({
  data,
  loading,
  error,
  isEmpty,
  emptyTitle,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  onRetry,
  onDismiss,
  children,
  className
}: AsyncDataStateProps<T>) {
  return (
    <LoadingErrorState
      loading={loading}
      error={error}
      isEmpty={data ? isEmpty(data) : false}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      emptyActionLabel={emptyActionLabel}
      onEmptyAction={onEmptyAction}
      onRetry={onRetry}
      onDismiss={onDismiss}
      className={className}
    >
      {data && children(data)}
    </LoadingErrorState>
  )
} 