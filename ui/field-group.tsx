"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface FieldGroupProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: "sm" | "md" | "lg"
  className?: string
}

const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ children, columns = 1, gap = "md", className, ...props }, ref) => {
    const gapClasses = {
      sm: "gap-3",
      md: "gap-6",
      lg: "gap-8",
    }

    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }

    return (
      <div ref={ref} className={cn("grid", columnClasses[columns], gapClasses[gap], className)} {...props}>
        {children}
      </div>
    )
  },
)
FieldGroup.displayName = "FieldGroup"

export { FieldGroup }
