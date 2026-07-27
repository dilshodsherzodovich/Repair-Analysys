import {
  AnnualPlanCell,
  AnnualPlanFactInspection,
  AnnualPlanReportOrganization,
  AnnualPlanReportRow,
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

// ── Cell accessors ────────────────────────────────────────────────────────
// `report` cells are plain numbers, `fact` cells are `{ count, inspections }`.
// Everything below reads cells through these two helpers so both shapes work.

export function cellCount(cell: AnnualPlanCell | undefined): number {
  if (typeof cell === "number") return cell;
  return cell?.count ?? 0;
}

export function cellInspections(
  cell: AnnualPlanCell | undefined
): AnnualPlanFactInspection[] {
  if (typeof cell === "number" || !cell) return [];
  return cell.inspections ?? [];
}

export const monthCount = (row: AnnualPlanReportRow | undefined, month: number) =>
  cellCount(row?.months[String(month)]);

export const quarterCount = (row: AnnualPlanReportRow | undefined, quarter: number) =>
  cellCount(row?.quarters[String(quarter)]);

export const monthInspections = (
  row: AnnualPlanReportRow | undefined,
  month: number
) => cellInspections(row?.months[String(month)]);

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
      for (let m = 1; m <= 12; m++) months[m] += monthCount(row, m);
      for (let q = 1; q <= 4; q++) quarters[q] += quarterCount(row, q);
      yearly += row.yearly_count ?? 0;
    });
  });

  return { months, quarters, yearly };
}

// ── Rendering the `inspections` payload ───────────────────────────────────
// The backend owns the field list, so instead of hard-coding columns we derive
// them from the data: known keys get a proper label and a fixed position,
// anything new still shows up (humanised) instead of silently disappearing.

const FIELD_LABELS: Record<string, string> = {
  locomotive: "Lokomotiv",
  locomotive_name: "Lokomotiv",
  locomotive_model: "Rusum",
  section: "Sektsiya",
  inspection_type: "Ko'rik turi",
  organization: "Tashkilot",
  branch: "Uchastka",
  author: "Mas'ul",
  entry_time: "Kirish vaqti",
  kanava_entry_time: "Kanavaga kirish",
  closed_time: "Yopilgan vaqti",
  is_closed_time: "Yopilgan vaqti",
  is_cancelled_time: "Bekor qilingan",
  created_time: "Yaratilgan",
  date: "Sana",
  start_date: "Boshlanish sanasi",
  end_date: "Tugash sanasi",
  duration: "Davomiyligi",
  mileage: "Yurgan yo'l",
  inspection_start_mileage: "Boshlang'ich yurish",
  mileage_interval: "Yurish oralig'i",
  hour_interval: "Soat oralig'i",
  command_number: "Buyruq raqami",
  comment: "Izoh",
  is_closed: "Yopilgan",
  is_cancelled: "Bekor qilingan",
};

/** Internal plumbing that carries no meaning in a details list. */
const HIDDEN_FIELDS = new Set(["id", "url", "organization_id", "locomotive_id"]);

/** Columns shown first, in this order, when the payload contains them. */
const FIELD_ORDER = [
  "locomotive",
  "locomotive_name",
  "locomotive_model",
  "section",
  "inspection_type",
  "date",
  "entry_time",
  "start_date",
  "closed_time",
  "is_closed_time",
  "end_date",
  "author",
  "branch",
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2})?/;

const pad = (n: number) => String(n).padStart(2, "0");

/** Flattens one field to the string shown in the table / Excel cell. */
export function formatInspectionValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ha" : "Yo'q";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(formatInspectionValue).join(", ");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const label = obj.name ?? obj.title ?? obj.username ?? obj.label;
    return label != null ? String(label) : "—";
  }

  const str = String(value);
  if (ISO_DATE.test(str)) {
    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) {
      const day = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
      const hasTime = /[T ]\d{2}:\d{2}/.test(str);
      return hasTime ? `${day} ${pad(d.getHours())}:${pad(d.getMinutes())}` : day;
    }
  }
  return str;
}

/** "command_number" → "Command number", used when a key has no known label. */
const humanise = (key: string) => {
  const words = key.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export interface InspectionField {
  key: string;
  label: string;
}

/**
 * The columns worth showing for a set of inspections: every key that carries a
 * value in at least one row, known keys first in `FIELD_ORDER`.
 */
export function inspectionFields(
  inspections: AnnualPlanFactInspection[]
): InspectionField[] {
  const keys = new Set<string>();
  inspections.forEach((ins) => {
    Object.entries(ins ?? {}).forEach(([key, value]) => {
      if (HIDDEN_FIELDS.has(key)) return;
      if (value == null || value === "") return;
      keys.add(key);
    });
  });

  const rank = (key: string) => {
    const i = FIELD_ORDER.indexOf(key);
    return i === -1 ? FIELD_ORDER.length : i;
  };

  return Array.from(keys)
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((key) => ({ key, label: FIELD_LABELS[key] ?? humanise(key) }));
}

/** Best-effort one-line title for an inspection (used as the row heading). */
export function inspectionTitle(ins: AnnualPlanFactInspection): string {
  for (const key of ["locomotive", "locomotive_name", "locomotive_number", "name"]) {
    const v = formatInspectionValue(ins?.[key]);
    if (v !== "—") return v;
  }
  return ins?.id != null ? `#${ins.id}` : "—";
}

/** Every inspection listed under one model row, tagged with its month. */
export function rowInspections(row: AnnualPlanReportRow) {
  const out: { month: number; inspection: AnnualPlanFactInspection }[] = [];
  for (let m = 1; m <= 12; m++) {
    monthInspections(row, m).forEach((inspection) => out.push({ month: m, inspection }));
  }
  return out;
}
