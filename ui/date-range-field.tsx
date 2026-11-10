"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";

export interface DateRange {
  from?: Date;
  to?: Date;
}

const DAY = "dd.MM.yyyy";

const withTime = (date: Date | undefined, time: string) => {
  if (!date) return undefined;
  const [h, m] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(h || 0, m || 0, 0, 0);
  return next;
};

const sameRange = (a: DateRange, b: DateRange) =>
  a.from?.getTime() === b.from?.getTime() && a.to?.getTime() === b.to?.getTime();

/**
 * The one control for a period: a single 36px trigger showing
 * "dd.MM.yyyy – dd.MM.yyyy" (with times when `showTime`). The range is picked
 * in a two-month calendar and committed when the picker closes, so a page
 * reloads once per change, never on a half-picked range.
 */
export function DateRangeField({
  value,
  onChange,
  showTime = false,
  placeholder,
  className,
  id,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Adds start / end time inputs under the calendar. */
  showTime?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const t = useTranslations("Common");
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange>(value);
  const [fromTime, setFromTime] = React.useState(value.from ? format(value.from, "HH:mm") : "00:00");
  const [toTime, setToTime] = React.useState(value.to ? format(value.to, "HH:mm") : "23:59");

  // Start each opening from the current value
  React.useEffect(() => {
    if (open) {
      setDraft(value);
      setFromTime(value.from ? format(value.from, "HH:mm") : "00:00");
      setToTime(value.to ? format(value.to, "HH:mm") : "23:59");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) return;
    const committed: DateRange = showTime
      ? { from: withTime(draft.from, fromTime), to: withTime(draft.to ?? draft.from, toTime) }
      : { from: draft.from, to: draft.to ?? draft.from };
    if (!sameRange(committed, value)) onChange(committed);
  };

  const pattern = showTime ? `${DAY} HH:mm` : DAY;
  const label =
    value.from && value.to
      ? `${format(value.from, pattern)} – ${format(value.to, pattern)}`
      : value.from
        ? format(value.from, pattern)
        : placeholder ?? t("period");

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "h-9 w-full justify-start gap-2 px-3 font-normal sm:h-9 sm:px-3",
            !value.from && "text-foreground-subtle",
            className,
          )}
        >
          <CalendarIcon className="text-primary" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={{ from: draft.from, to: draft.to }}
          onSelect={(range) => setDraft({ from: range?.from, to: range?.to })}
          defaultMonth={draft.from}
          captionLayout="dropdown"
        />
        {showTime && (
          <div className="flex items-end gap-3 border-t border-border p-3">
            <div className="flex flex-col gap-1">
              <Label className="mb-0 text-2xs sm:mb-0 sm:text-2xs">{t("time_from")}</Label>
              <Input variant="compact" type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="mb-0 text-2xs sm:mb-0 sm:text-2xs">{t("time_to")}</Label>
              <Input variant="compact" type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
