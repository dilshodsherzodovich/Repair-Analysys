import {
  formatDate as formatDateOnly,
  formatDateTime,
  formatTime,
} from "@/lib/format";

/** Older helper; the formats live in lib/format. Returns null when empty. */
export const formatDate = (
  dateTimeString: string,
  view: "datetime" | "date" | "time" = "datetime"
) => {
  if (!dateTimeString) return null;
  if (view === "date") return formatDateOnly(dateTimeString);
  if (view === "time") return formatTime(dateTimeString);
  return formatDateTime(dateTimeString);
};

export const getTimeFromDate = (dateString: string) => formatTime(dateString, "");
