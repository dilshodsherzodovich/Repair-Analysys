"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export interface FormWrapperProps {
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  loading?: boolean
  error?: string
  success?: string
  className?: string
  title?: string
  description?: string
}

const FormWrapper = React.forwardRef<HTMLFormElement, FormWrapperProps>(
  ({ children, onSubmit, loading, error, success, className, title, description, ...props }, ref) => {
    return (
      <div className="space-y-6">
        {(title || description) && (
          <div className="text-center">
            {title && <h2 className="text-2xl font-bold text-[#1f2937] mb-2">{title}</h2>}
            {description && <p className="text-[#6b7280]">{description}</p>}
          </div>
        )}

        <form ref={ref} onSubmit={onSubmit} className={cn("space-y-6", className)} {...props}>
          {children}

          {/* Global form messages */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-[#ff5959]/10 border border-[#ff5959]/20 rounded-lg text-[#ff5959]">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg text-[#10b981]">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 p-4 text-[#6b7280]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm">Обработка запроса...</p>
            </div>
          )}
        </form>
      </div>
    )
  },
)
FormWrapper.displayName = "FormWrapper"

export { FormWrapper }
