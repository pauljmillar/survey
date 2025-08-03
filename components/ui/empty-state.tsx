import { ReactNode } from 'react'
import { Card } from './card'
import { Button } from './button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`p-8 text-center ${className}`}>
      {icon && <div className="text-4xl mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  )
} 