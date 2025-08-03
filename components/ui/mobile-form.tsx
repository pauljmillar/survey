import * as React from "react"
import { cn } from "@/lib/utils"

const MobileForm = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => (
  <form
    ref={ref}
    className={cn("space-y-6", className)}
    {...props}
  />
))
MobileForm.displayName = "MobileForm"

const MobileFormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
))
MobileFormField.displayName = "MobileFormField"

const MobileFormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
MobileFormLabel.displayName = "MobileFormLabel"

const MobileFormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
))
MobileFormControl.displayName = "MobileFormControl"

const MobileFormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
MobileFormDescription.displayName = "MobileFormDescription"

const MobileFormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  if (!children) {
    return null
  }
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
})
MobileFormMessage.displayName = "MobileFormMessage"

// Mobile-optimized input wrapper
const MobileInputWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative",
      "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
      "rounded-md transition-all duration-200",
      className
    )}
    {...props}
  />
))
MobileInputWrapper.displayName = "MobileInputWrapper"

// Mobile-optimized form group
const MobileFormGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: 'sm' | 'md' | 'lg'
  }
>(({ className, spacing = 'md', ...props }, ref) => {
  const spacingClasses = {
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6'
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col",
        spacingClasses[spacing],
        className
      )}
      {...props}
    />
  )
})
MobileFormGroup.displayName = "MobileFormGroup"

// Mobile-optimized form actions
const MobileFormActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    layout?: 'stack' | 'row' | 'responsive'
  }
>(({ className, layout = 'responsive', ...props }, ref) => {
  const layoutClasses = {
    stack: 'flex flex-col space-y-3',
    row: 'flex flex-row space-x-3',
    responsive: 'flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3'
  }

  return (
    <div
      ref={ref}
      className={cn(
        layoutClasses[layout],
        className
      )}
      {...props}
    />
  )
})
MobileFormActions.displayName = "MobileFormActions"

export {
  MobileForm,
  MobileFormField,
  MobileFormLabel,
  MobileFormControl,
  MobileFormDescription,
  MobileFormMessage,
  MobileInputWrapper,
  MobileFormGroup,
  MobileFormActions,
} 