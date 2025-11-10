"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ContentContainerProps {
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  padding?: "none" | "sm" | "md" | "lg"
}

const ContentContainer = React.forwardRef<HTMLDivElement, ContentContainerProps>(
  ({ children, className, size = "lg", padding = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "max-w-2xl",
      md: "max-w-4xl",
      lg: "max-w-6xl",
      xl: "max-w-7xl",
      full: "max-w-full",
    }

    const paddingClasses = {
      none: "",
      sm: "px-4 py-4",
      md: "px-6 py-6",
      lg: "px-8 py-8",
    }

    return (
      <div ref={ref} className={cn("mx-auto w-full", sizeClasses[size], paddingClasses[padding], className)} {...props}>
        {children}
      </div>
    )
  },
)
ContentContainer.displayName = "ContentContainer"

export { ContentContainer }
