"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#2354bf] text-white hover:bg-[#1e40af] focus-visible:ring-[#2354bf]/50",
        destructive: "bg-[#ff5959] text-white hover:bg-[#ef4444] focus-visible:ring-[#ff5959]/50",
        outline:
          "border border-[#d1d5db] bg-white hover:bg-[#f9fafb] hover:text-[#1f2937] focus-visible:ring-[#2354bf]/50",
        secondary: "bg-[#f3f4f6] text-[#1f2937] hover:bg-[#e5e7eb] focus-visible:ring-[#6b7280]/50",
        ghost: "hover:bg-[#f3f4f6] hover:text-[#1f2937] focus-visible:ring-[#6b7280]/50",
        link: "text-[#2354bf] underline-offset-4 hover:underline focus-visible:ring-[#2354bf]/50",
        success: "bg-[#10b981] text-white hover:bg-[#059669] focus-visible:ring-[#10b981]/50",
        warning: "bg-[#f59e0b] text-white hover:bg-[#d97706] focus-visible:ring-[#f59e0b]/50",
      },
      size: {
        default: "h-12 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-14 rounded-lg px-8",
        xl: "h-16 rounded-lg px-10 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidth && "w-full",
          loading && "cursor-not-allowed",
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        <div className="flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingText || children}
            </>
          ) : (
            <>
              {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
              <span>{children}</span>
              {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </>
          )}
        </div>
      </Comp>
    )
  },
)
EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, buttonVariants }
