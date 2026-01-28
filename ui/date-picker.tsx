"use client";

import * as React from "react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { CalendarIcon, AlertCircle, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { useTranslations } from "next-intl";

export interface DatePickerProps {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  placeholder?: string;
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  size?: "sm" | "md" | "lg";
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      label,
      error,
      success,
      hint,
      placeholder,
      value,
      onValueChange,
      disabled = false,
      className,
      minDate,
      maxDate,
      size = "md",
      ...props
    },
    ref
  ) => {
    const t = useTranslations("DatePicker");
    const [isOpen, setIsOpen] = React.useState(false);
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <label className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-[var(--muted-foreground)] mb-1">
            {label}
          </label>
        )}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              size={size}
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal shadow-none",
                "hover:bg-white hover:text-[#374151] hover:border-[#d1d5db]",
                !value && "text-[#9ca3af]",
                hasError
                  ? "border-[#ff5959] focus:ring-2 focus:ring-[#ff5959]/20"
                  : hasSuccess
                  ? "border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                  : "border-[#d1d5db]"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value
                ? format(value, "dd.MM.yyyy", { locale: uz })
                : placeholder ?? t("placeholder")}
              <div className="ml-auto flex items-center space-x-1">
                {value && !disabled && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onValueChange?.(undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        e.preventDefault();
                        onValueChange?.(undefined);
                      }
                    }}
                    className="hover:bg-gray-100 rounded p-0.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                    aria-label={t("clear_aria")}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </div>
                )}
                {hasError && <AlertCircle className="h-4 w-4 text-[#ff5959]" />}
                {hasSuccess && (
                  <CheckCircle className="h-4 w-4 text-[#10b981]" />
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 focus:outline-none focus:ring-0"
            align="start"
            sideOffset={4}
          >
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                onValueChange?.(date);
                setIsOpen(false);
              }}
              disabled={(date) => {
                if (disabled) return true;
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

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
DatePicker.displayName = "DatePicker";

export { DatePicker };
