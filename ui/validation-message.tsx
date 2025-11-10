"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

export interface ValidationMessageProps {
  type?: "error" | "success" | "info"
  message: string
  className?: string
}

const ValidationMessage = React.forwardRef<HTMLDivElement, ValidationMessageProps>(
  ({ type = "error", message, className, ...props }, ref) => {
    const getIcon = () => {
      switch (type) {
        case "success":
          return <CheckCircle className="h-3 w-3" />
        case "info":
          return <Info className="h-3 w-3" />
        default:
          return <AlertCircle className="h-3 w-3" />
      }
    }

    const getColorClasses = () => {
      switch (type) {
        case "success":
          return "text-[#10b981]"
        case "info":
          return "text-[#2354bf]"
        default:
          return "text-[#ff5959]"
      }
    }

    return (
      <div ref={ref} className={cn("flex items-center gap-1 text-xs", getColorClasses(), className)} {...props}>
        {getIcon()}
        <span>{message}</span>
      </div>
    )
  },
)
ValidationMessage.displayName = "ValidationMessage"

export { ValidationMessage }
