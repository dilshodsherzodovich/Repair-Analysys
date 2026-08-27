import * as XLSX from "xlsx";
import type {
  Txk13Organization,
  Txk13Inspection,
} from "@/api/types/txk13-report";

type ActiveUnit = "all" | "km" | "hours";

export interface MileageReportLabels {
  sheetTitle: string;
  no: string;
  series: string;
  number: string;
  manufactured_date: string;
  bandaj: string;
  total_mileage: string;
  avg: string;
  sana: string;
  tamirdan: string;
  norma: string;
  qoldiq: string;
  keyingi: string;
}

interface ExportArgs {
  orgs: Txk13Organization[];
  inspectionTypes: { type_id: number; type: string }[];
  activeUnit: ActiveUnit;
  labels: MileageReportLabels;
  fileName: string;
}

const fmt = (n: number | null | undefined) =>
  n == null ? "0" : n.toLocaleString("en-US");

const SUB_PER_TYPE = 5; // sana, tamirdan, norma, qoldiq, keyingi (actual-sana hidden)
const FIXED_COLS = 7;

function inspVisibility(insp: Txk13Inspection | undefined, unit: ActiveUnit) {
  const hasLastDate = !!insp && !!insp.last_date && insp.last_date !== "-";
  const showKm = unit !== "hours" && !!insp && (insp.km_norm > 0 || hasLastDate);
  const showHours = unit !== "km" && !!insp && insp.hours_norm > 0;
  return { showKm, showHours };
}

function numCell(km: number, hours: number, showKm: boolean, showHours: boolean) {
  const parts: string[] = [];
  if (showKm) parts.push(`${fmt(km)} km`);
  if (showHours) parts.push(`${fmt(hours)} s`);
  return parts.length ? parts.join(" / ") : "—";
}

function dateCell(km: string, hours: string, showKm: boolean, showHours: boolean) {
  const parts: string[] = [];
  if (showKm && km && km !== "-") parts.push(km);
  if (showHours && hours && hours !== "-") parts.push(hours);
  return parts.length ? parts.join(" / ") : "—";
}

export function exportMileageReportToExcel({
  orgs,
  inspectionTypes,
  activeUnit,
  labels,
  fileName,
}: ExportArgs) {
  const totalCols = FIXED_COLS + inspectionTypes.length * SUB_PER_TYPE;
  const rows: (string | number)[][] = [];
  const merges: XLSX.Range[] = [];

  // --- Header rows (2) ---
  const header1: (string | number)[] = [
    labels.no,
    labels.series,
    labels.number,
    labels.manufactured_date,
    labels.bandaj,
    labels.total_mileage,
    labels.avg,
  ];
  const header2: (string | number)[] = ["", "", "", "", "", "", ""];

  // fixed columns span both header rows
  for (let c = 0; c < FIXED_COLS; c++) {
    merges.push({ s: { r: 0, c }, e: { r: 1, c } });
  }

  const subLabels = [
    labels.sana,
    labels.tamirdan,
    labels.norma,
    labels.qoldiq,
    labels.keyingi,
  ];
  inspectionTypes.forEach((insp, idx) => {
    const start = FIXED_COLS + idx * SUB_PER_TYPE;
    header1[start] = insp.type;
    for (let s = 1; s < SUB_PER_TYPE; s++) header1[start + s] = "";
    subLabels.forEach((lbl, s) => (header2[start + s] = lbl));
    merges.push({ s: { r: 0, c: start }, e: { r: 0, c: start + SUB_PER_TYPE - 1 } });
  });

  rows.push(header1, header2);

  // --- Body ---
  let r = 2;
  for (const org of orgs) {
    // org group row (merged across all columns)
    const orgRow: (string | number)[] = new Array(totalCols).fill("");
    orgRow[0] = `${org.organization_name} (${org.locomotives.length})`;
    rows.push(orgRow);
    merges.push({ s: { r, c: 0 }, e: { r, c: totalCols - 1 } });
    r++;

    for (const loco of org.locomotives) {
      const map = new Map<number, Txk13Inspection>();
      loco.inspections.forEach((i) => map.set(i.type_id, i));

      const row: (string | number)[] = [
        loco.index,
        loco.series,
        loco.number,
        loco.manufactured_date || "—",
        loco.bandaj_thickness == null ? "—" : loco.bandaj_thickness,
        fmt(loco.total_mileage),
        fmt(loco.average_monthly_mileage),
      ];

      for (const insp of inspectionTypes) {
        const ins = map.get(insp.type_id);
        const { showKm, showHours } = inspVisibility(ins, activeUnit);
        if (!ins || (!showKm && !showHours)) {
          row.push("—", "—", "—", "—", "—");
          continue;
        }
        row.push(
          ins.last_date === "-" ? "—" : ins.last_date,
          numCell(ins.km_value_since_repair, ins.hours_value_since_repair, showKm, showHours),
          numCell(ins.km_norm, ins.hours_norm, showKm, showHours),
          numCell(ins.km_difference, ins.hours_difference, showKm, showHours),
          dateCell(ins.km_next_repair_date, ins.hours_next_repair_date, showKm, showHours),
        );
      }
      rows.push(row);
      r++;
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!merges"] = merges;
  ws["!cols"] = Array.from({ length: totalCols }, (_, i) => ({
    wch: i < FIXED_COLS ? [5, 12, 12, 16, 10, 14, 14][i] : 14,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, labels.sheetTitle.slice(0, 31) || "Report");
  XLSX.writeFile(wb, fileName);
}
