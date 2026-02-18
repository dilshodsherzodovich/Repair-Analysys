"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface TimePickerProps {
  label?: string;
  value?: Date;
  onValueChange?: (date: Date) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/** Format Date to "HH:mm" for input[type="time"] (24h). */
function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Parse "HH:mm" or "HH:mm:ss" and set on a date. */
function applyTimeToDate(base: Date, timeStr: string): Date {
  const parts = timeStr.trim().split(":").map((s) => parseInt(s, 10) || 0);
  const h = Math.min(23, Math.max(0, parts[0] ?? 0));
  const m = Math.min(59, Math.max(0, parts[1] ?? 0));
  const next = new Date(base);
  next.setHours(h, m, 0, 0);
  return next;
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  (
    {
      label,
      value,
      onValueChange,
      disabled = false,
      className,
      placeholder = "00:00",
    },
    ref
  ) => {
    const t = useTranslations("DatePicker");
    const timeValue = value ? dateToTimeString(value) : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const timeStr = e.target.value;
      if (!timeStr) return;
      const base = value ? new Date(value) : new Date();
      onValueChange?.(applyTimeToDate(base, timeStr));
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <label className="flex items-center gap-2 text-sm leading-none font-medium select-none text-[var(--muted-foreground)] mb-1">
            {label}
          </label>
        )}
        <input
          type="time"
          value={timeValue}
          onChange={handleChange}
          disabled={disabled}
          step="60"
          placeholder={placeholder}
          aria-label={label ?? t("time_label")}
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base",
            "transition-colors outline-none focus:border-blue-500 focus:ring-0 hover:border-gray-400",
            "disabled:pointer-events-none disabled:opacity-50 disabled:bg-gray-50",
            "md:text-sm text-[#0F172B]",
            "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          )}
        />
      </div>
    );
  }
);
TimePicker.displayName = "TimePicker";

export { TimePicker };
