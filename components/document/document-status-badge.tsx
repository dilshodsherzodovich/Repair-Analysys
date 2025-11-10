"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, Archive, FileText } from "lucide-react"

export interface DocumentStatusBadgeProps {
  status: "draft" | "review" | "approved" | "archived"
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

const DocumentStatusBadge = React.forwardRef<HTMLSpanElement, DocumentStatusBadgeProps>(
  ({ status, size = "md", showIcon = true, className, ...props }, ref) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case "approved":
          return {
            label: "Утверждено",
            icon: <CheckCircle className="w-3 h-3" />,
            className: "bg-[#10b981] text-white",
          }
        case "review":
          return {
            label: "На рассмотрении",
            icon: <Clock className="w-3 h-3" />,
            className: "bg-[#f59e0b] text-white",
          }
        case "archived":
          return {
            label: "Архивировано",
            icon: <Archive className="w-3 h-3" />,
            className: "bg-[#6b7280] text-white",
          }
        default:
          return {
            label: "Черновик",
            icon: <FileText className="w-3 h-3" />,
            className: "bg-[#e5e7eb] text-[#374151]",
          }
      }
    }

    const getSizeClasses = (size: string) => {
      switch (size) {
        case "sm":
          return "px-2 py-0.5 text-xs"
        case "lg":
          return "px-4 py-2 text-sm"
        default:
          return "px-3 py-1 text-sm"
      }
    }

    const config = getStatusConfig(status)

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          getSizeClasses(size),
          config.className,
          className,
        )}
        {...props}
      >
        {showIcon && config.icon}
        {config.label}
      </span>
    )
  },
)
DocumentStatusBadge.displayName = "DocumentStatusBadge"

export { DocumentStatusBadge }
