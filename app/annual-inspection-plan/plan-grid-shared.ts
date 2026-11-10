import {
  AnnualPlanReportOrganization,
  cellCount,
} from "@/api/types/annual-inspection-plan";

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
  { bar: "bg-primary", soft: "bg-primary-subtle", text: "text-primary-hover", ring: "border-primary/30", ringColor: "ring-primary/70" },
  { bar: "bg-success", soft: "bg-success-subtle", text: "text-success", ring: "border-success/30", ringColor: "ring-success/70" },
  { bar: "bg-warning", soft: "bg-warning-subtle", text: "text-warning", ring: "border-warning/30", ringColor: "ring-warning/70" },
  { bar: "bg-category-violet", soft: "bg-category-violet/10", text: "text-category-violet", ring: "border-category-violet/25", ringColor: "ring-category-violet/70" },
  { bar: "bg-category-rose", soft: "bg-category-rose/10", text: "text-category-rose", ring: "border-category-rose/25", ringColor: "ring-category-rose/70" },
  { bar: "bg-category-cyan", soft: "bg-category-cyan/10", text: "text-category-cyan", ring: "border-category-cyan/25", ringColor: "ring-category-cyan/70" },
] as const;

export const accentFor = (idx: number) => TYPE_ACCENTS[idx % TYPE_ACCENTS.length];

export const quarterOfMonth = (month: number) => Math.floor((month - 1) / 3) + 1;

/**
 * Counts may be fractional (the backend stores them as decimals), so sums pick
 * up binary-float noise — 3.5 + 1.2 lands on 4.699999999999999. Round to two
 * decimals and drop the trailing zeros.
 */
export const roundCount = (n: number) => Math.round(n * 100) / 100;

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
      for (let m = 1; m <= 12; m++) months[m] += cellCount(row.months[String(m)]);
      for (let q = 1; q <= 4; q++) quarters[q] += cellCount(row.quarters[String(q)]);
      yearly += cellCount(row.yearly_count);
    });
  });

  for (let m = 1; m <= 12; m++) months[m] = roundCount(months[m]);
  for (let q = 1; q <= 4; q++) quarters[q] = roundCount(quarters[q]);

  return { months, quarters, yearly: roundCount(yearly) };
}
