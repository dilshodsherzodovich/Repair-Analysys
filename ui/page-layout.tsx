"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  sidebarWidth?: "sm" | "md" | "lg"
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, sidebar, header, footer, className, sidebarWidth = "md", maxWidth = "full", ...props }, ref) => {
    const sidebarWidthClasses = {
      sm: "w-64",
      md: "w-72",
      lg: "w-80",
    }

    const maxWidthClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      full: "max-w-full",
    }

    return (
      <div ref={ref} className={cn("min-h-screen bg-[#f9fafb]", className)} {...props}>
        {header && <div className="sticky top-0 z-40 bg-white border-b border-[#e5e7eb]">{header}</div>}

        <div className="flex">
          {sidebar && (
            <div className={cn("flex-shrink-0 bg-white border-r border-[#e5e7eb]", sidebarWidthClasses[sidebarWidth])}>
              <div className="sticky top-0 h-screen overflow-y-auto">{sidebar}</div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <main className={cn("mx-auto px-4 py-6", maxWidthClasses[maxWidth])}>{children}</main>
          </div>
        </div>

        {footer && <div className="bg-white border-t border-[#e5e7eb]">{footer}</div>}
      </div>
    )
  },
)
PageLayout.displayName = "PageLayout"

export { PageLayout }
