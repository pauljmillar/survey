import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  children: React.ReactNode
}

const MobileGrid = React.forwardRef<HTMLDivElement, MobileGridProps>(
  ({ className, cols = { mobile: 1, tablet: 2, desktop: 3 }, gap = { mobile: 4, tablet: 6, desktop: 8 }, children, ...props }, ref) => {
    const getGridCols = () => {
      return `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`
    }

    const getGridGap = () => {
      return `gap-${gap.mobile} sm:gap-${gap.tablet} lg:gap-${gap.desktop}`
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          getGridCols(),
          getGridGap(),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileGrid.displayName = "MobileGrid"

interface MobileStackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  children: React.ReactNode
}

const MobileStack = React.forwardRef<HTMLDivElement, MobileStackProps>(
  ({ className, spacing = { mobile: 4, tablet: 6, desktop: 8 }, children, ...props }, ref) => {
    const getStackSpacing = () => {
      return `space-y-${spacing.mobile} sm:space-y-${spacing.tablet} lg:space-y-${spacing.desktop}`
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          getStackSpacing(),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileStack.displayName = "MobileStack"

interface MobileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  children: React.ReactNode
}

const MobileContainer = React.forwardRef<HTMLDivElement, MobileContainerProps>(
  ({ className, maxWidth = 'xl', padding = { mobile: 4, tablet: 6, desktop: 8 }, children, ...props }, ref) => {
    const getMaxWidth = () => {
      const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-full'
      }
      return maxWidthClasses[maxWidth]
    }

    const getPadding = () => {
      return `px-${padding.mobile} sm:px-${padding.tablet} lg:px-${padding.desktop}`
    }

    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          getMaxWidth(),
          getPadding(),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileContainer.displayName = "MobileContainer"

export { MobileGrid, MobileStack, MobileContainer } 