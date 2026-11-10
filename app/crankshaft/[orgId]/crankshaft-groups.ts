/**
 * Crankshaft value groups. A value lands in the group of its whole part:
 * 0 ≤ v < 1 is group 0, 1 ≤ v < 2 is group 1, ... 6 ≤ v < 7 is group 6,
 * and everything from 7 up is group 7.
 */
export const CRANKSHAFT_GROUPS = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
  key: String(n),
  range: n === 7 ? "7+" : `${n}–${n + 1}`,
}));

const LAST_GROUP = 7;

/** The group of one koren / shatun value; null when the cell is empty. */
export const crankshaftGroupKey = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return String(Math.min(LAST_GROUP, Math.floor(n)));
};

export const isKorenField = (field: string) => field.includes("koren");
export const isShatunField = (field: string) => field.includes("shatun");
