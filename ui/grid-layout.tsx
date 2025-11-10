"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface GridLayoutProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: "none" | "sm" | "md" | "lg" | "xl"
  className?: string
  responsive?: boolean
}

const GridLayout = React.forwardRef<HTMLDivElement, GridLayoutProps>(
  ({ children, columns = 3, gap = "md", className, responsive = true, ...props }, ref) => {
    const gapClasses = {
      none: "gap-0",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    }

    const getColumnClasses = (cols: number, responsive: boolean) => {
      if (!responsive) {
        return `grid-cols-${cols}`
      }

      switch (cols) {
        case 1:
          return "grid-cols-1"
        case 2:
          return "grid-cols-1 md:grid-cols-2"
        case 3:
          return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        case 4:
          return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        case 5:
          return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        case 6:
          return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        default:
          return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      }
    }

    return (
      <div
        ref={ref}
        className={cn("grid", getColumnClasses(columns, responsive), gapClasses[gap], className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
GridLayout.displayName = "GridLayout"

export { GridLayout }
