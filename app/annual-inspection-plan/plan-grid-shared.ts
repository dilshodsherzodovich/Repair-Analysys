import { AnnualPlanReportOrganization } from "@/api/types/annual-inspection-plan";

/** Short Uzbek month labels, index 0 = January. */
export const MONTHS_SHORT = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];

/** Full Uzbek month labels, index 0 = January. */
export const MONTHS_FULL = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

export const QUARTER_LABELS = ["I", "II", "III", "IV"];

export type GridColumn =
  | { kind: "month"; month: number }
  | { kind: "quarter"; quarter: number };

/**
 * Column order matching the printed "grafik raboti": three months then their
 * quarter subtotal, repeated for all four quarters.
 */
export const GRID_COLUMNS: GridColumn[] = (() => {
  const cols: GridColumn[] = [];
  for (let q = 0; q < 4; q++) {
    for (let m = 0; m < 3; m++) cols.push({ kind: "month", month: q * 3 + m + 1 });
    cols.push({ kind: "quarter", quarter: q + 1 });
  }
  return cols;
})();

/**
 * Per-inspection-type accent colours (cycled by index) so each card in the
 * stack is visually distinct. Class strings are written out literally so
 * Tailwind's JIT keeps them.
 */
export const TYPE_ACCENTS = [
  { bar: "bg-blue-500", soft: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", ring: "border-blue-200 dark:border-blue-900/70", ringColor: "ring-blue-500/70" },
  { bar: "bg-emerald-500", soft: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", ring: "border-emerald-200 dark:border-emerald-900/70", ringColor: "ring-emerald-500/70" },
  { bar: "bg-amber-500", soft: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", ring: "border-amber-200 dark:border-amber-900/70", ringColor: "ring-amber-500/70" },
  { bar: "bg-violet-500", soft: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", ring: "border-violet-200 dark:border-violet-900/70", ringColor: "ring-violet-500/70" },
  { bar: "bg-rose-500", soft: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", ring: "border-rose-200 dark:border-rose-900/70", ringColor: "ring-rose-500/70" },
  { bar: "bg-cyan-500", soft: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", ring: "border-cyan-200 dark:border-cyan-900/70", ringColor: "ring-cyan-500/70" },
] as const;

export const accentFor = (idx: number) => TYPE_ACCENTS[idx % TYPE_ACCENTS.length];

export const quarterOfMonth = (month: number) => Math.floor((month - 1) / 3) + 1;

export interface OrgTotals {
  months: Record<number, number>;
  quarters: Record<number, number>;
  yearly: number;
}

/** Sums every model row across every inspection type of one organization. */
export function computeOrgTotals(org: AnnualPlanReportOrganization): OrgTotals {
  const months: Record<number, number> = {};
  const quarters: Record<number, number> = {};
  let yearly = 0;
  for (let m = 1; m <= 12; m++) months[m] = 0;
  for (let q = 1; q <= 4; q++) quarters[q] = 0;

  org.inspection_types.forEach((type) => {
    type.locomotive_models.forEach((row) => {
      for (let m = 1; m <= 12; m++) months[m] += row.months[String(m)] ?? 0;
      for (let q = 1; q <= 4; q++) quarters[q] += row.quarters[String(q)] ?? 0;
      yearly += row.yearly_count ?? 0;
    });
  });

  return { months, quarters, yearly };
}
