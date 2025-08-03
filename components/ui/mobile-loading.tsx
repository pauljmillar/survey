import * as React from "react"
import { cn } from "@/lib/utils"

// Mobile-optimized skeleton component
const MobileSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-pulse rounded-md bg-muted", className)}
    {...props}
  />
))
MobileSkeleton.displayName = "MobileSkeleton"

// Mobile-optimized spinner component
const MobileSpinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div
      ref={ref}
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
})
MobileSpinner.displayName = "MobileSpinner"

// Mobile-optimized loading overlay
const MobileLoadingOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode
    loading?: boolean
    message?: string
  }
>(({ className, children, loading = false, message = "Loading...", ...props }, ref) => {
  if (!loading) {
    return <>{children}</>
  }

  return (
    <div ref={ref} className="relative" {...props}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-card border shadow-lg">
          <MobileSpinner size="lg" />
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
})
MobileLoadingOverlay.displayName = "MobileLoadingOverlay"

// Mobile-optimized loading page
const MobileLoadingPage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    message?: string
    showSpinner?: boolean
  }
>(({ className, message = "Loading...", showSpinner = true, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-card border shadow-lg max-w-sm w-full">
        {showSpinner && <MobileSpinner size="lg" />}
        <p className="text-sm font-medium text-muted-foreground text-center">{message}</p>
      </div>
    </div>
  )
})
MobileLoadingPage.displayName = "MobileLoadingPage"

// Mobile-optimized skeleton components
const MobileSkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border p-4 space-y-3",
      className
    )}
    {...props}
  >
    <div className="flex items-center space-x-3">
      <MobileSkeleton className="w-12 h-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <MobileSkeleton className="h-4 w-3/4" />
        <MobileSkeleton className="h-3 w-1/2" />
      </div>
    </div>
    <MobileSkeleton className="h-4 w-full" />
    <MobileSkeleton className="h-4 w-2/3" />
  </div>
))
MobileSkeletonCard.displayName = "MobileSkeletonCard"

const MobileSkeletonList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    count?: number
  }
>(({ className, count = 3, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-4", className)}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <MobileSkeletonCard key={index} />
      ))}
    </div>
  )
})
MobileSkeletonList.displayName = "MobileSkeletonList"

// Mobile-optimized progress indicator
const MobileProgress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
  }
>(({ className, value, max = 100, size = 'md', showLabel = true, ...props }, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  return (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
      {...props}
    >
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
})
MobileProgress.displayName = "MobileProgress"

export {
  MobileSkeleton,
  MobileSpinner,
  MobileLoadingOverlay,
  MobileLoadingPage,
  MobileSkeletonCard,
  MobileSkeletonList,
  MobileProgress,
} 