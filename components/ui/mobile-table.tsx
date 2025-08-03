import * as React from "react"
import { cn } from "@/lib/utils"

const MobileTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
MobileTable.displayName = "MobileTable"

const MobileTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
MobileTableHeader.displayName = "MobileTableHeader"

const MobileTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
MobileTableBody.displayName = "MobileTableBody"

const MobileTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("bg-primary font-medium text-primary-foreground", className)}
    {...props}
  />
))
MobileTableFooter.displayName = "MobileTableFooter"

const MobileTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
MobileTableRow.displayName = "MobileTableRow"

const MobileTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
MobileTableHead.displayName = "MobileTableHead"

const MobileTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
MobileTableCell.displayName = "MobileTableCell"

const MobileTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
MobileTableCaption.displayName = "MobileTableCaption"

// Mobile-optimized table wrapper with horizontal scroll
const MobileTableWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full overflow-x-auto border rounded-lg",
      "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
      "dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
MobileTableWrapper.displayName = "MobileTableWrapper"

export {
  MobileTable,
  MobileTableHeader,
  MobileTableBody,
  MobileTableFooter,
  MobileTableHead,
  MobileTableRow,
  MobileTableCell,
  MobileTableCaption,
  MobileTableWrapper,
} 