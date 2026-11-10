import { format, isValid, parseISO } from "date-fns";

/**
 * The one way the app prints numbers and dates (see "Formats" in the
 * design-system spec). Numbers group thousands with a space (1 234 567),
 * dates are dd.MM.yyyy, times HH:mm, and a missing value is "—".
 * API parameters keep their own "yyyy-MM-dd"; these are for display only.
 */

export const EMPTY = "—";

export const DATE_FORMAT = "dd.MM.yyyy";
export const DATE_TIME_FORMAT = "dd.MM.yyyy HH:mm";
export const TIME_FORMAT = "HH:mm";
/** Dense report cells where the year is obvious from the period. */
export const SHORT_DATE_TIME_FORMAT = "dd.MM HH:mm";

const numberFormats = new Map<number, Intl.NumberFormat>();
function numberFormat(digits: number) {
  let f = numberFormats.get(digits);
  if (!f) {
    f = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits });
    numberFormats.set(digits, f);
  }
  return f;
}

type NumberInput = number | string | null | undefined;

function toNumber(value: NumberInput): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

/** 1234567.8 -> "1 234 568"; `digits` keeps decimals (comma separator). */
export function formatNumber(
  value: NumberInput,
  { digits = 0, fallback = EMPTY, suffix = "" }: { digits?: number; fallback?: string; suffix?: string } = {}
): string {
  const n = toNumber(value);
  if (n === null) return fallback;
  return numberFormat(digits).format(n) + suffix;
}

/** Sums of money: "1 234 567 so'm" (no decimals). */
export function formatMoney(value: NumberInput, { fallback = "0" }: { fallback?: string } = {}): string {
  const n = toNumber(value);
  if (n === null || n === 0) return fallback === "0" ? "0 so'm" : fallback;
  return `${numberFormat(0).format(Math.round(n))} so'm`;
}

type DateInput = Date | string | number | null | undefined;

/** Accepts Date, timestamps, ISO and "yyyy-MM-dd HH:mm" strings. */
export function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  const d = parseISO(value.includes("T") || value.length <= 10 ? value : value.replace(" ", "T"));
  return isValid(d) ? d : null;
}

function formatWith(pattern: string, value: DateInput, fallback: string) {
  const d = toDate(value);
  return d ? format(d, pattern) : fallback;
}

export const formatDate = (value: DateInput, fallback = EMPTY) => formatWith(DATE_FORMAT, value, fallback);
export const formatDateTime = (value: DateInput, fallback = EMPTY) =>
  formatWith(DATE_TIME_FORMAT, value, fallback);
export const formatTime = (value: DateInput, fallback = EMPTY) => formatWith(TIME_FORMAT, value, fallback);
export const formatShortDateTime = (value: DateInput, fallback = EMPTY) =>
  formatWith(SHORT_DATE_TIME_FORMAT, value, fallback);
