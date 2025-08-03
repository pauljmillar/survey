import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileNavItem {
  label: string
  href: string
  icon?: React.ReactNode
  children?: MobileNavItem[]
}

interface MobileNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MobileNavItem[]
  activeItem?: string
  onItemClick?: (item: MobileNavItem) => void
  variant?: 'vertical' | 'horizontal' | 'tabs'
}

const MobileNavigation = React.forwardRef<HTMLDivElement, MobileNavigationProps>(
  ({ className, items, activeItem, onItemClick, variant = 'vertical', ...props }, ref) => {
    const renderNavItem = (item: MobileNavItem, index: number) => {
      const isActive = activeItem === item.href
      
      return (
        <div key={index} className="relative">
          <button
            onClick={() => onItemClick?.(item)}
            className={cn(
              "w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "touch-manipulation min-h-[44px]", // iOS touch target minimum
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
              variant === 'horizontal' && "flex-col space-y-1 px-3 py-2",
              variant === 'tabs' && "border-b-2 border-transparent hover:border-muted-foreground",
              className
            )}
          >
            {item.icon && (
              <span className="mr-3 flex-shrink-0">
                {item.icon}
              </span>
            )}
            <span className="truncate">{item.label}</span>
          </button>
          
          {item.children && (
            <div className="ml-4 mt-2 space-y-1">
              {item.children.map((child, childIndex) => (
                <button
                  key={childIndex}
                  onClick={() => onItemClick?.(child)}
                  className={cn(
                    "w-full flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "touch-manipulation min-h-[44px]",
                    activeItem === child.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {child.icon && (
                    <span className="mr-3 flex-shrink-0">
                      {child.icon}
                    </span>
                  )}
                  <span className="truncate">{child.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }

    const containerClasses = {
      vertical: "flex flex-col space-y-1",
      horizontal: "flex flex-row space-x-1 overflow-x-auto scrollbar-hide",
      tabs: "flex flex-row space-x-1 border-b"
    }

    return (
      <nav
        ref={ref}
        className={cn(
          containerClasses[variant],
          className
        )}
        {...props}
      >
        {items.map(renderNavItem)}
      </nav>
    )
  }
)
MobileNavigation.displayName = "MobileNavigation"

// Mobile-optimized breadcrumb component
interface MobileBreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<{
    label: string
    href?: string
  }>
  separator?: React.ReactNode
}

const MobileBreadcrumb = React.forwardRef<HTMLDivElement, MobileBreadcrumbProps>(
  ({ className, items, separator = "/", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center space-x-2 text-sm text-muted-foreground",
          "overflow-x-auto scrollbar-hide",
          className
        )}
        {...props}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="flex-shrink-0 text-muted-foreground">
                {separator}
              </span>
            )}
            <span
              className={cn(
                "truncate",
                item.href
                  ? "hover:text-foreground cursor-pointer"
                  : "text-foreground font-medium"
              )}
            >
              {item.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    )
  }
)
MobileBreadcrumb.displayName = "MobileBreadcrumb"

// Mobile-optimized pagination component
interface MobilePaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPageNumbers?: boolean
}

const MobilePagination = React.forwardRef<HTMLDivElement, MobilePaginationProps>(
  ({ className, currentPage, totalPages, onPageChange, showPageNumbers = true, ...props }, ref) => {
    const getVisiblePages = () => {
      const delta = 2
      const range = []
      const rangeWithDots = []

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i)
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...')
      } else {
        rangeWithDots.push(1)
      }

      rangeWithDots.push(...range)

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages)
      } else {
        rangeWithDots.push(totalPages)
      }

      return rangeWithDots
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center space-x-2",
          className
        )}
        {...props}
      >
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-md border",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "touch-manipulation",
            currentPage === 1
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-muted"
          )}
        >
          ←
        </button>

        {showPageNumbers && (
          <div className="flex items-center space-x-1">
            {getVisiblePages().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={typeof page !== 'number'}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-md border",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "touch-manipulation",
                  typeof page === 'number'
                    ? page === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                    : "cursor-default"
                )}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-md border",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "touch-manipulation",
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-muted"
          )}
        >
          →
        </button>
      </div>
    )
  }
)
MobilePagination.displayName = "MobilePagination"

export { MobileNavigation, MobileBreadcrumb, MobilePagination } 