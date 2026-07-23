"use client";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import {
  AnnualPlanReport,
  AnnualPlanReportOrganization,
  AnnualPlanReportRow,
} from "@/api/types/annual-inspection-plan";

const MONTHS_SHORT = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];
const QUARTERS = ["I kv.", "II kv.", "III kv.", "IV kv."];

const thin = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };
const solid = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

const NAVY = "FF1E3A5F";
const SUMMARY_HEAD = "FF6D28D9"; // violet-700 — for quarter & yearly headers
const QUARTER_CELL = "FFEDE9FE"; // violet-100 — quarter data cells
const MUTED_TXT = "FF94A3B8";
// status → fill + text
const STATUS = {
  done: { fill: "FFDCFCE7", text: "FF166534" }, // green
  partial: { fill: "FFFEF3C7", text: "FF92400E" }, // amber
  missed: { fill: "FFFEE2E2", text: "FF991B1B" }, // rose
  extra: { fill: "FFDBEAFE", text: "FF1E40AF" }, // blue
};

function statusOf(plan: number, fact: number): keyof typeof STATUS | null {
  if (plan === 0 && fact === 0) return null;
  if (plan === 0 && fact > 0) return "extra";
  if (fact >= plan) return "done";
  if (fact > 0) return "partial";
  return "missed";
}

type Col = { kind: "month"; i: number } | { kind: "quarter"; i: number };
const COLS: Col[] = (() => {
  const cols: Col[] = [];
  for (let q = 0; q < 4; q++) {
    for (let m = 0; m < 3; m++) cols.push({ kind: "month", i: q * 3 + m });
    cols.push({ kind: "quarter", i: q });
  }
  return cols;
})();

const mVal = (row: AnnualPlanReportRow | undefined, m: number) => row?.months[String(m)] ?? 0;
const qVal = (row: AnnualPlanReportRow | undefined, q: number) => row?.quarters[String(q)] ?? 0;
const yVal = (row: AnnualPlanReportRow | undefined) => row?.yearly_count ?? 0;

interface MergedType {
  id: number;
  name: string;
  models: { name: string; plan?: AnnualPlanReportRow; fact?: AnnualPlanReportRow }[];
}

function mergeTypes(planOrg?: AnnualPlanReportOrganization, factOrg?: AnnualPlanReportOrganization): MergedType[] {
  const planMap = new Map(planOrg?.inspection_types.map((t) => [t.inspection_type.id, t]) ?? []);
  const factMap = new Map(factOrg?.inspection_types.map((t) => [t.inspection_type.id, t]) ?? []);
  const ids: number[] = [];
  planOrg?.inspection_types.forEach((t) => ids.push(t.inspection_type.id));
  factOrg?.inspection_types.forEach((t) => {
    if (!ids.includes(t.inspection_type.id)) ids.push(t.inspection_type.id);
  });

  return ids.map((id) => {
    const pt = planMap.get(id);
    const ft = factMap.get(id);
    const mId = (r: AnnualPlanReportRow) => r.locomotive_model?.id ?? -1;
    const mName = (r: AnnualPlanReportRow) => r.locomotive_model?.name ?? "—";
    const map = new Map<number, { name: string; plan?: AnnualPlanReportRow; fact?: AnnualPlanReportRow }>();
    pt?.locomotive_models.forEach((r) => map.set(mId(r), { name: mName(r), plan: r }));
    ft?.locomotive_models.forEach((r) => {
      const ex = map.get(mId(r));
      if (ex) ex.fact = r;
      else map.set(mId(r), { name: mName(r), fact: r });
    });
    return { id, name: pt?.inspection_type.name ?? ft?.inspection_type.name ?? String(id), models: [...map.values()] };
  });
}

export async function exportAnnualPlanCompareExcel(
  plan: AnnualPlanReport | undefined,
  fact: AnnualPlanReport | undefined,
  year: number
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Repair Analysys";

  const orgIds = Array.from(
    new Set([
      ...(plan?.organizations ?? []).map((o) => o.organization.id),
      ...(fact?.organizations ?? []).map((o) => o.organization.id),
    ])
  );

  const totalCols = 4 + COLS.length;
  const yearlyCol = totalCols;

  // Sheet columns occupied by quarter subtotals (1-based).
  const quarterCols = new Set<number>();
  COLS.forEach((c, ci) => {
    if (c.kind === "quarter") quarterCols.add(4 + ci);
  });

  orgIds.forEach((orgId, orgIdx) => {
    const planOrg = plan?.organizations.find((o) => o.organization.id === orgId);
    const factOrg = fact?.organizations.find((o) => o.organization.id === orgId);
    const orgName = planOrg?.organization.name ?? factOrg?.organization.name ?? `Org ${orgIdx + 1}`;
    const ws = wb.addWorksheet(orgName.replace(/[\\/*?:[\]]/g, " ").slice(0, 31) || `Org ${orgIdx + 1}`, {
      views: [{ state: "frozen", ySplit: 4, xSplit: 3 }],
    });

    // Title + legend
    ws.mergeCells(1, 1, 1, totalCols);
    const title = ws.getCell(1, 1);
    title.value = `${orgName} — ${year}-yil reja / fakt taqqoslash (Fakt / Reja)`;
    title.font = { bold: true, size: 13, color: { argb: NAVY } };
    title.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 24;

    ws.mergeCells(2, 1, 2, totalCols);
    const legend = ws.getCell(2, 1);
    legend.value = "Yashil — bajarildi · Sariq — qisman · Qizil — bajarilmadi · Ko'k — rejadan tashqari";
    legend.font = { size: 9, color: { argb: "FF64748B" } };
    legend.alignment = { horizontal: "center" };

    // Header
    const headerRow = 4;
    const headers = ["№", "Ta'mir turi", "Lokomotiv rusumi"];
    COLS.forEach((c) => headers.push(c.kind === "month" ? MONTHS_SHORT[c.i] : QUARTERS[c.i]));
    headers.push("Yillik");
    headers.forEach((h, idx) => {
      const col = idx + 1;
      const cell = ws.getCell(headerRow, col);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = solid(col === yearlyCol || quarterCols.has(col) ? SUMMARY_HEAD : NAVY);
      cell.border = border;
    });
    ws.getRow(headerRow).height = 26;

    const types = mergeTypes(planOrg, factOrg);
    const totFact: Record<string, number> = { yearly: 0 };
    const totPlan: Record<string, number> = { yearly: 0 };
    COLS.forEach((c) => {
      totFact[`${c.kind}${c.i}`] = 0;
      totPlan[`${c.kind}${c.i}`] = 0;
    });

    let r = headerRow + 1;
    let typeNo = 0;

    const paint = (cell: ExcelJS.Cell, plan: number, factN: number, isQuarter = false) => {
      cell.border = border;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      const st = statusOf(plan, factN);
      // Quarter cells: always violet fill, status shown via text colour.
      if (isQuarter) {
        cell.fill = solid(QUARTER_CELL);
        cell.value = st ? `${factN}/${plan}` : "";
        cell.font = { size: 10, bold: !!st, color: { argb: st ? STATUS[st].text : MUTED_TXT } };
        return;
      }
      if (!st) {
        cell.value = "";
        cell.font = { size: 10, color: { argb: MUTED_TXT } };
        return;
      }
      cell.value = `${factN}/${plan}`;
      cell.fill = solid(STATUS[st].fill);
      cell.font = { size: 10, bold: true, color: { argb: STATUS[st].text } };
    };

    types.forEach((type) => {
      if (type.models.length === 0) return;
      typeNo += 1;
      const firstRow = r;
      type.models.forEach((mdl) => {
        ws.getCell(r, 3).value = mdl.name;
        ws.getCell(r, 3).border = border;
        ws.getCell(r, 3).font = { size: 10 };
        ws.getCell(r, 3).alignment = { vertical: "middle" };
        COLS.forEach((c, ci) => {
          const p = c.kind === "month" ? mVal(mdl.plan, c.i + 1) : qVal(mdl.plan, c.i + 1);
          const f = c.kind === "month" ? mVal(mdl.fact, c.i + 1) : qVal(mdl.fact, c.i + 1);
          paint(ws.getCell(r, 4 + ci), p, f, c.kind === "quarter");
          totPlan[`${c.kind}${c.i}`] += p;
          totFact[`${c.kind}${c.i}`] += f;
        });
        paint(ws.getCell(r, yearlyCol), yVal(mdl.plan), yVal(mdl.fact));
        totPlan.yearly += yVal(mdl.plan);
        totFact.yearly += yVal(mdl.fact);
        ws.getRow(r).height = 18;
        r++;
      });
      ws.mergeCells(firstRow, 1, r - 1, 1);
      ws.mergeCells(firstRow, 2, r - 1, 2);
      const noCell = ws.getCell(firstRow, 1);
      noCell.value = typeNo;
      noCell.alignment = { horizontal: "center", vertical: "middle" };
      noCell.border = border;
      const typeCell = ws.getCell(firstRow, 2);
      typeCell.value = type.name;
      typeCell.font = { bold: true, size: 10 };
      typeCell.alignment = { horizontal: "left", vertical: "middle" };
      typeCell.border = border;
    });

    // Totals row
    ws.mergeCells(r, 1, r, 3);
    const totalLabel = ws.getCell(r, 1);
    totalLabel.value = "Umumiy";
    totalLabel.font = { bold: true, size: 10 };
    totalLabel.alignment = { horizontal: "right", vertical: "middle" };
    totalLabel.fill = solid("FFE2E8F0");
    totalLabel.border = border;
    COLS.forEach((c, ci) => {
      const cell = ws.getCell(r, 4 + ci);
      cell.value = `${totFact[`${c.kind}${c.i}`]}/${totPlan[`${c.kind}${c.i}`]}`;
      cell.font = { bold: true, size: 10 };
      cell.fill = solid(c.kind === "quarter" ? QUARTER_CELL : "FFE2E8F0");
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = border;
    });
    const yCell = ws.getCell(r, yearlyCol);
    yCell.value = `${totFact.yearly}/${totPlan.yearly}`;
    yCell.font = { bold: true, size: 10 };
    yCell.fill = solid("FFE2E8F0");
    yCell.alignment = { horizontal: "center", vertical: "middle" };
    yCell.border = border;

    // Widths
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 18;
    ws.getColumn(3).width = 18;
    for (let i = 0; i < COLS.length; i++) ws.getColumn(4 + i).width = 8;
    ws.getColumn(yearlyCol).width = 10;
  });

  if (orgIds.length === 0) wb.addWorksheet("Bo'sh");

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `texnik-koriklar-taqqoslash_${year}.xlsx`);
}
