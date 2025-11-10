"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle } from "lucide-react";

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  loading?: boolean;
  variant?: "default" | "search" | "password";
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  (
    {
      className,
      type,
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      clearable,
      loading,
      variant = "default",
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value || "");

    React.useEffect(() => {
      setInternalValue(value || "");
    }, [value]);

    const handleClear = () => {
      setInternalValue("");
      if (onChange) {
        const event = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      if (onChange) {
        onChange(e);
      }
    };

    const inputType =
      variant === "password" ? (showPassword ? "text" : "password") : type;

    const hasError = !!error;
    const hasSuccess = !!success && !hasError;

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-[#374151] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280]">
              {leftIcon}
            </div>
          )}
          {variant === "search" && !leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280]">
              <Search className="h-4 w-4" />
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              "flex h-12 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-[#9ca3af] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon || variant === "search" ? "pl-10" : "",
              rightIcon ||
                clearable ||
                variant === "password" ||
                loading ||
                hasError ||
                hasSuccess
                ? "pr-10"
                : "",
              hasError
                ? "border-[#ff5959] focus-visible:ring-2 focus-visible:ring-[#ff5959]/20"
                : hasSuccess
                ? "border-[#10b981] focus-visible:ring-2 focus-visible:ring-[#10b981]/20"
                : "border-[#d1d5db] focus-visible:ring-2 focus-visible:ring-[#2354bf]/20",
              className
            )}
            ref={ref}
            value={internalValue}
            onChange={handleChange}
            {...props}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-1 border-[#2354bf] border-t-transparent" />
            )}
            {hasError && <AlertCircle className="h-4 w-4 text-[#ff5959]" />}
            {hasSuccess && <CheckCircle className="h-4 w-4 text-[#10b981]" />}
            {variant === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#6b7280] hover:text-[#374151] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            {clearable && internalValue && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#6b7280] hover:text-[#374151] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {rightIcon &&
              !loading &&
              !hasError &&
              !hasSuccess &&
              !clearable &&
              variant !== "password" && (
                <div className="text-[#6b7280]">{rightIcon}</div>
              )}
          </div>
        </div>
        {hint && !error && !success && (
          <p className="text-xs text-[#6b7280]">{hint}</p>
        )}
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
    );
  }
);
EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };
