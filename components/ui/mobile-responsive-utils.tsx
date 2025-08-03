import { useEffect, useState } from 'react'

// Hook to detect mobile device
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}

// Hook to detect touch device
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouchDevice
}

// Hook to get viewport dimensions
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return viewport
}

// Utility to get responsive breakpoint
export function getBreakpoint(width: number): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  if (width < 640) return 'xs'
  if (width < 768) return 'sm'
  if (width < 1024) return 'md'
  if (width < 1280) return 'lg'
  if (width < 1536) return 'xl'
  return '2xl'
}

// Hook to get current breakpoint
export function useBreakpoint() {
  const viewport = useViewport()
  return getBreakpoint(viewport.width)
}

// Utility to check if element is in viewport
export function useInViewport(ref: React.RefObject<HTMLElement>) {
  const [isInViewport, setIsInViewport] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [ref])

  return isInViewport
}

// Utility for touch-friendly spacing
export const touchSpacing = {
  button: 'min-h-[44px] min-w-[44px]', // iOS touch target minimum
  input: 'min-h-[44px]',
  link: 'min-h-[44px] min-w-[44px]',
  icon: 'w-12 h-12', // Square touch target
}

// Utility for responsive spacing
export const responsiveSpacing = {
  xs: 'space-y-2 sm:space-y-3 md:space-y-4',
  sm: 'space-y-3 sm:space-y-4 md:space-y-6',
  md: 'space-y-4 sm:space-y-6 md:space-y-8',
  lg: 'space-y-6 sm:space-y-8 md:space-y-12',
}

// Utility for responsive padding
export const responsivePadding = {
  xs: 'p-2 sm:p-3 md:p-4',
  sm: 'p-3 sm:p-4 md:p-6',
  md: 'p-4 sm:p-6 md:p-8',
  lg: 'p-6 sm:p-8 md:p-12',
}

// Utility for responsive margins
export const responsiveMargin = {
  xs: 'm-2 sm:m-3 md:m-4',
  sm: 'm-3 sm:m-4 md:m-6',
  md: 'm-4 sm:m-6 md:m-8',
  lg: 'm-6 sm:m-8 md:m-12',
}

// Utility for responsive text sizes
export const responsiveText = {
  xs: 'text-xs sm:text-sm md:text-base',
  sm: 'text-sm sm:text-base md:text-lg',
  md: 'text-base sm:text-lg md:text-xl',
  lg: 'text-lg sm:text-xl md:text-2xl',
  xl: 'text-xl sm:text-2xl md:text-3xl',
  '2xl': 'text-2xl sm:text-3xl md:text-4xl',
}

// Utility for responsive grid columns
export const responsiveGrid = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
}

// Utility for responsive flex directions
export const responsiveFlex = {
  row: 'flex-col sm:flex-row',
  col: 'flex-row sm:flex-col',
  'row-reverse': 'flex-col-reverse sm:flex-row-reverse',
  'col-reverse': 'flex-row-reverse sm:flex-col-reverse',
}

// Utility for responsive visibility
export const responsiveVisibility = {
  'mobile-only': 'block sm:hidden',
  'tablet-only': 'hidden sm:block md:hidden',
  'desktop-only': 'hidden md:block',
  'mobile-tablet': 'block md:hidden',
  'tablet-desktop': 'hidden sm:block',
}

// Utility for responsive positioning
export const responsivePosition = {
  'sticky-top': 'sticky top-0 z-10',
  'sticky-bottom': 'sticky bottom-0 z-10',
  'fixed-top': 'fixed top-0 left-0 right-0 z-50',
  'fixed-bottom': 'fixed bottom-0 left-0 right-0 z-50',
}

// Utility for responsive overflow
export const responsiveOverflow = {
  'scroll-x': 'overflow-x-auto scrollbar-hide',
  'scroll-y': 'overflow-y-auto scrollbar-hide',
  'scroll-both': 'overflow-auto scrollbar-hide',
  'hidden': 'overflow-hidden',
}

// Utility for responsive borders
export const responsiveBorders = {
  'rounded-sm': 'rounded sm:rounded-md md:rounded-lg',
  'rounded-md': 'rounded-md sm:rounded-lg md:rounded-xl',
  'rounded-lg': 'rounded-lg sm:rounded-xl md:rounded-2xl',
  'border-sm': 'border sm:border-2',
  'border-md': 'border-2 sm:border-4',
}

// Utility for responsive shadows
export const responsiveShadows = {
  'shadow-sm': 'shadow-sm sm:shadow md:shadow-lg',
  'shadow-md': 'shadow md:shadow-lg lg:shadow-xl',
  'shadow-lg': 'shadow-lg lg:shadow-xl xl:shadow-2xl',
}

// Utility for responsive transitions
export const responsiveTransitions = {
  'fast': 'transition-all duration-150 ease-out',
  'normal': 'transition-all duration-200 ease-out',
  'slow': 'transition-all duration-300 ease-out',
  'bounce': 'transition-all duration-200 ease-bounce',
}

// Utility for responsive animations
export const responsiveAnimations = {
  'fade-in': 'animate-in fade-in duration-300',
  'slide-up': 'animate-in slide-in-from-bottom duration-300',
  'slide-down': 'animate-in slide-in-from-top duration-300',
  'slide-left': 'animate-in slide-in-from-right duration-300',
  'slide-right': 'animate-in slide-in-from-left duration-300',
  'scale-in': 'animate-in zoom-in duration-300',
  'scale-out': 'animate-in zoom-out duration-300',
}

// Utility for responsive focus states
export const responsiveFocus = {
  'ring': 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  'ring-sm': 'focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1',
  'ring-lg': 'focus:outline-none focus:ring-4 focus:ring-primary focus:ring-offset-4',
  'border': 'focus:outline-none focus:border-primary focus:border-2',
  'none': 'focus:outline-none',
}

// Utility for responsive hover states
export const responsiveHover = {
  'scale': 'hover:scale-105 active:scale-95',
  'scale-sm': 'hover:scale-102 active:scale-98',
  'scale-lg': 'hover:scale-110 active:scale-90',
  'lift': 'hover:-translate-y-1 active:translate-y-0',
  'glow': 'hover:shadow-lg hover:shadow-primary/25',
}

// Utility for responsive active states
export const responsiveActive = {
  'scale': 'active:scale-95',
  'scale-sm': 'active:scale-98',
  'scale-lg': 'active:scale-90',
  'press': 'active:translate-y-0.5',
  'glow': 'active:shadow-inner',
}

// Utility for responsive disabled states
export const responsiveDisabled = {
  'opacity': 'disabled:opacity-50 disabled:cursor-not-allowed',
  'grayscale': 'disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed',
  'blur': 'disabled:blur-sm disabled:opacity-50 disabled:cursor-not-allowed',
}

// Utility for responsive loading states
export const responsiveLoading = {
  'spinner': 'animate-spin',
  'pulse': 'animate-pulse',
  'bounce': 'animate-bounce',
  'ping': 'animate-ping',
  'spin': 'animate-spin',
}

// Utility for responsive error states
export const responsiveError = {
  'border': 'border-destructive focus:border-destructive',
  'ring': 'ring-destructive focus:ring-destructive',
  'text': 'text-destructive',
  'bg': 'bg-destructive/10',
}

// Utility for responsive success states
export const responsiveSuccess = {
  'border': 'border-green-500 focus:border-green-500',
  'ring': 'ring-green-500 focus:ring-green-500',
  'text': 'text-green-600',
  'bg': 'bg-green-50 dark:bg-green-900/20',
}

// Utility for responsive warning states
export const responsiveWarning = {
  'border': 'border-yellow-500 focus:border-yellow-500',
  'ring': 'ring-yellow-500 focus:ring-yellow-500',
  'text': 'text-yellow-600',
  'bg': 'bg-yellow-50 dark:bg-yellow-900/20',
}

// Utility for responsive info states
export const responsiveInfo = {
  'border': 'border-blue-500 focus:border-blue-500',
  'ring': 'ring-blue-500 focus:ring-blue-500',
  'text': 'text-blue-600',
  'bg': 'bg-blue-50 dark:bg-blue-900/20',
} 