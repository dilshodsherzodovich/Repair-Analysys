import { UserRole } from "@/api/types/user";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPageCount(
  totalItems: number,
  itemsPerPage: number = 10,
): number {
  return Math.ceil(totalItems / itemsPerPage);
}

export const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("uz-UZ");
  } catch {
    return dateString;
  }
};

export const getRoleName = (roleName: UserRole): string => {
  switch (roleName) {
    case "admin": {
      return "Administrator";
    }
    default: {
      return "";
    }
  }
};

export const truncate = (text: string, options: { length: number }) => {
  return text.length > options.length
    ? text.slice(0, options.length) + "..."
    : text;
};

export const getFileName = (url: string) => {
  if (!url) return "Fayl topilmadi";
  const fileName = url.split("/").pop() || "download";

  return truncate(fileName, { length: 100 });
};

/**
 * Written out in full rather than interpolated: Tailwind only emits classes it
 * can find as literal strings in the source, so `grid-cols-${n}` would compile
 * to nothing.
 */
const GRID_COLS = [
  "grid-cols-1",
  "grid-cols-1",
  "grid-cols-2",
  "grid-cols-3",
  "grid-cols-4",
  "grid-cols-5",
  "grid-cols-6",
  "grid-cols-7",
  "grid-cols-8",
  "grid-cols-9",
  "grid-cols-10",
  "grid-cols-11",
  "grid-cols-12",
] as const;

/**
 * Tailwind grid-cols class for a row of `length` items, capped at `limit`.
 *
 * Under the cap the grid gets exactly as many columns as there are items, so a
 * short row spreads across the full width. At or over it the row is fixed to
 * `limit` columns and the extras wrap onto the next line.
 */
export const defineGridColsCount = (
  length: number | undefined,
  limit: number,
) => {
  if (!length || length < 1) return GRID_COLS[1];
  const columns = Math.min(length, limit, GRID_COLS.length - 1);
  return GRID_COLS[columns];
};
