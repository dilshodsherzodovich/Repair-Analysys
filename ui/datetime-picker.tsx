"use client";

import * as React from "react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { CalendarIcon, AlertCircle, CheckCircle, X, Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { ScrollArea } from "@/ui/scroll-area";
import { useTranslations } from "next-intl";

export interface DateTimePickerProps {
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

const DateTimePicker = React.forwardRef<HTMLDivElement, DateTimePickerProps>(
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
    const [hours, setHours] = React.useState(() =>
      value ? value.getHours() : new Date().getHours()
    );
    const [minutes, setMinutes] = React.useState(() =>
      value ? value.getMinutes() : new Date().getMinutes()
    );
    const [hoursStr, setHoursStr] = React.useState(() =>
      String(value ? value.getHours() : new Date().getHours()).padStart(2, "0")
    );
    const [minutesStr, setMinutesStr] = React.useState(() =>
      String(value ? value.getMinutes() : new Date().getMinutes()).padStart(2, "0")
    );
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;

    const selectedDate = value ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : undefined;

    React.useEffect(() => {
      if (value) {
        const h = value.getHours();
        const m = value.getMinutes();
        setHours(h);
        setMinutes(m);
        setHoursStr(String(h).padStart(2, "0"));
        setMinutesStr(String(m).padStart(2, "0"));
      } else {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        setHours(h);
        setMinutes(m);
        setHoursStr(String(h).padStart(2, "0"));
        setMinutesStr(String(m).padStart(2, "0"));
      }
    }, [value?.getTime()]);

    const applyTime = (base: Date, h: number, m: number) => {
      const next = new Date(base);
      next.setHours(
        Math.min(23, Math.max(0, h)),
        Math.min(59, Math.max(0, m)),
        0,
        0
      );
      return next;
    };

    const handleDateSelect = (date: Date | undefined) => {
      if (!date) {
        onValueChange?.(undefined);
        const n = new Date();
        setHours(n.getHours());
        setMinutes(n.getMinutes());
        return;
      }
      onValueChange?.(applyTime(date, hours, minutes));
    };

    const handleHoursInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
      setHoursStr(raw);
      const v = raw === "" ? 0 : Math.min(23, Math.max(0, parseInt(raw, 10)));
      setHours(v);
      // Don't call onValueChange here – it would update parent → effect overwrites hoursStr and blocks typing e.g. "12"
    };

    const handleMinutesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
      setMinutesStr(raw);
      const v = raw === "" ? 0 : Math.min(59, Math.max(0, parseInt(raw, 10)));
      setMinutes(v);
      // Don't call onValueChange here – same as hours
    };

    const handleHoursBlur = () => {
      setHoursStr(String(hours).padStart(2, "0"));
      if (value) onValueChange?.(applyTime(value, hours, minutes));
    };

    const handleMinutesBlur = () => {
      setMinutesStr(String(minutes).padStart(2, "0"));
      if (value) onValueChange?.(applyTime(value, hours, minutes));
    };

    const [hoursPickerOpen, setHoursPickerOpen] = React.useState(false);
    const [minutesPickerOpen, setMinutesPickerOpen] = React.useState(false);

    const handleSelectHour = (h: number) => {
      setHours(h);
      setHoursStr(String(h).padStart(2, "0"));
      setHoursPickerOpen(false);
      if (value) onValueChange?.(applyTime(value, h, minutes));
    };

    const handleSelectMinute = (m: number) => {
      setMinutes(m);
      setMinutesStr(String(m).padStart(2, "0"));
      setMinutesPickerOpen(false);
      if (value) onValueChange?.(applyTime(value, hours, m));
    };

    const handleClear = () => {
      onValueChange?.(undefined);
      const n = new Date();
      setHours(n.getHours());
      setMinutes(n.getMinutes());
    };

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
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              {value
                ? format(value, "dd.MM.yyyy HH:mm", { locale: uz })
                : placeholder ?? t("placeholder")}
              <div className="ml-auto flex items-center space-x-1">
                {value && !disabled && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleClear();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        e.preventDefault();
                        handleClear();
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
              selected={selectedDate}
              onSelect={(date) => handleDateSelect(date ?? undefined)}
              disabled={(date) => {
                if (disabled) return true;
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              initialFocus
            />
            <div className="border-t border-[#E2E8F0] p-3 select-text">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[#64748B]">
                <Clock className="h-3.5 w-3.5" />
                {t("time_label")} (24h)
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded-md border border-[#d1d5db] bg-white focus-within:border-[#2354bf] focus-within:ring-2 focus-within:ring-[#2354bf]/20">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={hoursStr}
                    onChange={handleHoursInput}
                    onBlur={handleHoursBlur}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={disabled}
                    placeholder="00"
                    autoComplete="off"
                    className="w-10 rounded-l-md border-0 bg-transparent px-2 py-2 text-center text-sm tabular-nums text-[#0F172B] select-text cursor-text focus:outline-none focus:ring-0"
                    aria-label={t("hours_24")}
                  />
                  <Popover open={hoursPickerOpen} onOpenChange={setHoursPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        className="h-9 w-9 shrink-0 rounded-l-none rounded-r-md border-0 border-l border-[#d1d5db] hover:bg-[#f1f5f9]"
                        aria-label={t("time_pick_hour")}
                      >
                        <ChevronDown className="h-4 w-4 text-[#64748B]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                      <ScrollArea className="h-[200px] w-14">
                        <div className="p-1">
                          {Array.from({ length: 24 }, (_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectHour(i)}
                              className={cn(
                                "flex w-full items-center justify-center rounded py-2 text-sm transition-colors",
                                hours === i
                                  ? "bg-[#2354bf] text-white"
                                  : "hover:bg-[#f1f5f9] text-[#0F172B]"
                              )}
                            >
                              {String(i).padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
                <span className="text-sm font-medium text-[#64748B]">:</span>
                <div className="flex items-center rounded-md border border-[#d1d5db] bg-white focus-within:border-[#2354bf] focus-within:ring-2 focus-within:ring-[#2354bf]/20">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={minutesStr}
                    onChange={handleMinutesInput}
                    onBlur={handleMinutesBlur}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={disabled}
                    placeholder="00"
                    autoComplete="off"
                    className="w-10 rounded-l-md border-0 bg-transparent px-2 py-2 text-center text-sm tabular-nums text-[#0F172B] select-text cursor-text focus:outline-none focus:ring-0"
                    aria-label={t("minutes_24")}
                  />
                  <Popover open={minutesPickerOpen} onOpenChange={setMinutesPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        className="h-9 w-9 shrink-0 rounded-l-none rounded-r-md border-0 border-l border-[#d1d5db] hover:bg-[#f1f5f9]"
                        aria-label={t("time_pick_minute")}
                      >
                        <ChevronDown className="h-4 w-4 text-[#64748B]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                      <ScrollArea className="h-[200px] w-14">
                        <div className="p-1">
                          {Array.from({ length: 60 }, (_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectMinute(i)}
                              className={cn(
                                "flex w-full items-center justify-center rounded py-2 text-sm transition-colors",
                                minutes === i
                                  ? "bg-[#2354bf] text-white"
                                  : "hover:bg-[#f1f5f9] text-[#0F172B]"
                              )}
                            >
                              {String(i).padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
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
DateTimePicker.displayName = "DateTimePicker";

export { DateTimePicker };
