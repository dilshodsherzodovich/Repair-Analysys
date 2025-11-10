"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle } from "lucide-react"

export interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  maxLength?: number
  showCount?: boolean
  autoResize?: boolean
}

const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  (
    {
      className,
      label,
      error,
      success,
      hint,
      maxLength,
      showCount = false,
      autoResize = false,
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || "")
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
      setInternalValue(value || "")
    }, [value])

    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = "auto"
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
      }
    }, [internalValue, autoResize])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      if (maxLength && newValue.length > maxLength) {
        return
      }
      setInternalValue(newValue)
      if (onChange) {
        onChange(e)
      }
    }

    const hasError = !!error
    const hasSuccess = !!success && !hasError
    const currentLength = String(internalValue).length

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-[#374151] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            className={cn(
              "flex min-h-[120px] w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors",
              "placeholder:text-[#9ca3af] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              "resize-none",
              hasError
                ? "border-[#ff5959] focus-visible:ring-2 focus-visible:ring-[#ff5959]/20"
                : hasSuccess
                  ? "border-[#10b981] focus-visible:ring-2 focus-visible:ring-[#10b981]/20"
                  : "border-[#d1d5db] focus-visible:ring-2 focus-visible:ring-[#2354bf]/20",
              autoResize && "overflow-hidden",
              className,
            )}
            ref={(node) => {
              textareaRef.current = node
              if (typeof ref === "function") {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
            }}
            value={internalValue}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />
          {(hasError || hasSuccess) && (
            <div className="absolute top-3 right-3">
              {hasError && <AlertCircle className="h-4 w-4 text-[#ff5959]" />}
              {hasSuccess && <CheckCircle className="h-4 w-4 text-[#10b981]" />}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div>
            {hint && !error && !success && <p className="text-xs text-[#6b7280]">{hint}</p>}
            {error && (
              <p className="text-xs text-[#ff5959] flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-[#10b981] flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {success}
              </p>
            )}
          </div>
          {(showCount || maxLength) && (
            <p
              className={cn(
                "text-xs",
                maxLength && currentLength > maxLength * 0.9 ? "text-[#ff5959]" : "text-[#6b7280]",
              )}
            >
              {currentLength}
              {maxLength && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    )
  },
)
EnhancedTextarea.displayName = "EnhancedTextarea"

export { EnhancedTextarea }
