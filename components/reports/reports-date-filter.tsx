"use client";

import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/popover";
import { CalendarIcon, ArrowRight, RotateCcw, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useReportFilters } from "@/lib/hooks/useReportFilters";

export default function ReportsDateFilter({
  leading,
}: {
  /**
   * Rendered as the first field of the row. Taking it as a slot (rather than
   * letting the page place it beside this component) keeps it a direct sibling
   * of the date fields, so `items-end` aligns them against each other.
   */
  leading?: React.ReactNode;
}) {
  const t = useTranslations("Reports");
  const { filters, setFilters } = useReportFilters();

  const [fromDateTime, setFromDateTime] = useState<Date | undefined>(() =>
    filters.fromDate ? new Date(filters.fromDate) : undefined
  );
  const [toDateTime, setToDateTime] = useState<Date | undefined>(() =>
    filters.toDate ? new Date(filters.toDate) : undefined
  );

  useEffect(() => {
    if (!filters.fromDate || !filters.toDate) {
      const now = new Date();
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      setFromDateTime((prev) => prev ?? twelveHoursAgo);
      setToDateTime((prev) => prev ?? now);
      setFilters({ fromDate: twelveHoursAgo.toISOString(), toDate: now.toISOString() });
    }
  }, []);

  const handleApply = () => {
    if (fromDateTime && toDateTime) {
      setFilters({ fromDate: fromDateTime.toISOString(), toDate: toDateTime.toISOString() });
    }
  };

  const handleReset = () => {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    setFromDateTime(twelveHoursAgo);
    setToDateTime(now);
    setFilters({ fromDate: twelveHoursAgo.toISOString(), toDate: now.toISOString() });
  };

  const handleDateChange = (date: Date | undefined, isFrom: boolean) => {
    if (isFrom) setFromDateTime(date);
    else setToDateTime(date);
  };

  const handleTimeChange = (timeString: string, isFrom: boolean) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const base = isFrom ? fromDateTime : toDateTime;
    if (base) {
      const updated = new Date(base);
      updated.setHours(hours, minutes, 0, 0);
      if (isFrom) setFromDateTime(updated);
      else setToDateTime(updated);
    }
  };

  const fmt = (d: Date) => format(d, "dd.MM.yyyy");
  const fmtTime = (d: Date) => format(d, "HH:mm");

  return (
    <div className="flex flex-wrap items-end gap-3">
      {leading}

      {/* From */}
      <DateBox
        label={t("fromDate")}
        date={fromDateTime}
        onDateChange={(d) => handleDateChange(d, true)}
        onTimeChange={(v) => handleTimeChange(v, true)}
        fmt={fmt}
        fmtTime={fmtTime}
      />

      <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 mb-2.5" />

      {/* To */}
      <DateBox
        label={t("toDate")}
        date={toDateTime}
        onDateChange={(d) => handleDateChange(d, false)}
        onTimeChange={(v) => handleTimeChange(v, false)}
        fmt={fmt}
        fmtTime={fmtTime}
      />

      {/* Apply */}
      <Button
        onClick={handleApply}
        className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 gap-1.5 mb-0"
      >
        <Check className="w-3.5 h-3.5" />
        {t("apply")}
      </Button>

      {/* Reset */}
      <button
        onClick={handleReset}
        title={t("reset")}
        className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function DateBox({
  label,
  date,
  onDateChange,
  onTimeChange,
  fmt,
  fmtTime,
}: {
  label: string;
  date: Date | undefined;
  onDateChange: (d: Date | undefined) => void;
  onTimeChange: (v: string) => void;
  fmt: (d: Date) => string;
  fmtTime: (d: Date) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-1">
        {label}
      </span>
      <div className="flex items-center gap-0 h-9 border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 h-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap border-r border-gray-200">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              {date ? fmt(date) : "—"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              captionLayout="dropdown"
              locale={uz}
            />
          </PopoverContent>
        </Popover>

        {/* Time picker */}
        <input
          type="time"
          value={date ? fmtTime(date) : ""}
          onChange={(e) => onTimeChange(e.target.value)}
          className="px-3 h-full text-sm font-medium text-gray-700 bg-transparent border-0 outline-none w-[125px] cursor-pointer hover:bg-gray-50 transition-colors"
        />
      </div>
    </div>
  );
}
