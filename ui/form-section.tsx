"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

export interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  required?: boolean
  className?: string
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  (
    {
      title,
      description,
      children,
      collapsible = false,
      defaultCollapsed = false,
      required = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

    const toggleCollapse = () => {
      if (collapsible) {
        setIsCollapsed(!isCollapsed)
      }
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <div
          className={cn(
            "flex items-center justify-between",
            collapsible && "cursor-pointer hover:text-[#2354bf] transition-colors",
          )}
          onClick={toggleCollapse}
        >
          <div>
            <h3 className="text-lg font-semibold text-[#1f2937] flex items-center gap-2">
              {title}
              {required && <span className="text-[#ff5959] text-sm">*</span>}
            </h3>
            {description && <p className="text-sm text-[#6b7280] mt-1">{description}</p>}
          </div>
          {collapsible && (
            <div className="text-[#6b7280]">
              {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="bg-[#f9fafb] rounded-lg p-6 border border-[#e5e7eb]">
            <div className="space-y-6">{children}</div>
          </div>
        )}
      </div>
    )
  },
)
FormSection.displayName = "FormSection"

export { FormSection }
