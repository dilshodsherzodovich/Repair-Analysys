"use client";

import { Button } from "@/ui/button";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/popover";
import { Calendar } from "@/ui/calendar";

export function getTashkentDateString(date: Date) {
  const fmt = new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date).reduce((acc: any, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {} as Record<string, string>);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatDisplayDDMMYYYY(apiDate: string) {
  if (!apiDate) return "";
  const [y, m, d] = apiDate.split("-");
  return `${d}-${m}-${y}`;
}

export default function DelayedReportFilters({
  fromDate,
  toDate,
  onChange,
  onRefresh,
  leading,
}: {
  fromDate: string; // yyyy-MM-dd
  toDate: string; // yyyy-MM-dd
  onChange: (d: { fromDate?: string; toDate?: string }) => void;
  onRefresh: () => void;
  /** Rendered as the first field, so it aligns with the date fields. */
  leading?: React.ReactNode;
}) {
  const t = useTranslations();

  const [fromDisplay, setFromDisplay] = useState<string>("");
  const [toDisplay, setToDisplay] = useState<string>("");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  useEffect(() => {
    setFromDisplay(formatDisplayDDMMYYYY(fromDate));
  }, [fromDate]);
  useEffect(() => {
    setToDisplay(formatDisplayDDMMYYYY(toDate));
  }, [toDate]);

  const fromSelected = (() => {
    const [y, m, d] = fromDate.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  })();
  const toSelected = (() => {
    const [y, m, d] = toDate.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  })();

  return (
    <div className="w-full flex flex-wrap gap-3 items-end">
      {leading}

      <div className="flex flex-col gap-2">
        <label className="text-sm h-5 flex items-end">{t("fromDate")}</label>
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 justify-between min-w-[180px]">
              {fromDisplay || "dd-MM-yyyy"}
              <CalendarIcon className="w-4 h-4 ml-2 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Calendar
              mode="single"
              selected={fromSelected}
              onSelect={(date) => {
                if (date) {
                  const api = getTashkentDateString(date);
                  onChange({ fromDate: api });
                  setFromOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm h-5 flex items-end">{t("toDate")}</label>
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 justify-between min-w-[180px]">
              {toDisplay || "dd-MM-yyyy"}
              <CalendarIcon className="w-4 h-4 ml-2 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Calendar
              mode="single"
              selected={toSelected}
              onSelect={(date) => {
                if (date) {
                  const api = getTashkentDateString(date);
                  onChange({ toDate: api });
                  setToOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button onClick={onRefresh}>{t("refresh")}</Button>
    </div>
  );
}
