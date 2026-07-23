"use client";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import { AnnualPlanReport } from "@/api/types/annual-inspection-plan";

const MONTHS_SHORT = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];
const QUARTERS = ["I kv.", "II kv.", "III kv.", "IV kv."];

const thin = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

const solid = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

// Colour language
const NAVY = "FF1E3A5F";
const QUARTER_HEAD = "FF15803D"; // green-700
const YEARLY_HEAD = "FF1D4ED8"; // blue-700
const QUARTER_BODY = "FFDCFCE7"; // green-100
const QUARTER_BODY_TXT = "FF166534"; // green-800
const YEARLY_BODY = "FFDBEAFE"; // blue-100
const YEARLY_BODY_TXT = "FF1E40AF"; // blue-800
const TOTAL_BODY = "FFE2E8F0"; // slate-200
const QUARTER_TOTAL = "FFBBF7D0"; // green-200
const YEARLY_TOTAL = "FFBFDBFE"; // blue-200

// month/quarter column order: 3 months then their quarter subtotal
type Col = { kind: "month"; i: number } | { kind: "quarter"; i: number };
const COLS: Col[] = (() => {
  const cols: Col[] = [];
  for (let q = 0; q < 4; q++) {
    for (let m = 0; m < 3; m++) cols.push({ kind: "month", i: q * 3 + m });
    cols.push({ kind: "quarter", i: q });
  }
  return cols;
})();

export async function exportAnnualPlanExcel(report: AnnualPlanReport) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Repair Analysys";

  // Sheet columns occupied by quarter subtotals (1-based).
  const quarterCols = new Set<number>();
  COLS.forEach((c, ci) => {
    if (c.kind === "quarter") quarterCols.add(4 + ci);
  });

  report.organizations.forEach((org, orgIdx) => {
    const sheetName = (org.organization.name || `Org ${orgIdx + 1}`)
      .replace(/[\\/*?:[\]]/g, " ")
      .slice(0, 31);
    const ws = wb.addWorksheet(sheetName || `Org ${orgIdx + 1}`, {
      views: [{ state: "frozen", ySplit: 3, xSplit: 3 }],
    });

    // Title
    const totalCols = 4 + COLS.length;
    const yearlyCol = totalCols; // yearly total sits at the very end
    ws.mergeCells(1, 1, 1, totalCols);
    const title = ws.getCell(1, 1);
    title.value = `${org.organization.name} — ${report.year}-yil texnik ko'riklar rejasi`;
    title.font = { bold: true, size: 13, color: { argb: NAVY } };
    title.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 26;

    // Header row
    const headerRow = 3;
    const headers = ["№", "Ta'mir turi", "Lokomotiv rusumi"];
    COLS.forEach((c) => headers.push(c.kind === "month" ? MONTHS_SHORT[c.i] : QUARTERS[c.i]));
    headers.push("Yillik reja");
    headers.forEach((h, idx) => {
      const col = idx + 1;
      const cell = ws.getCell(headerRow, col);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = solid(col === yearlyCol ? YEARLY_HEAD : quarterCols.has(col) ? QUARTER_HEAD : NAVY);
      cell.border = border;
    });
    ws.getRow(headerRow).height = 28;

    let r = headerRow + 1;
    const totals: Record<string, number> = { yearly: 0 };
    COLS.forEach((c) => (totals[`${c.kind}${c.i}`] = 0));

    org.inspection_types.forEach((type, typeIdx) => {
      const models = type.locomotive_models;
      if (models.length === 0) return;
      const firstRow = r;
      models.forEach((row) => {
        ws.getCell(r, 3).value = row.locomotive_model?.name ?? "—";
        COLS.forEach((c, ci) => {
          const val =
            c.kind === "month"
              ? row.months[String(c.i + 1)] || 0
              : row.quarters[String(c.i + 1)] || 0;
          ws.getCell(r, 4 + ci).value = val;
          totals[`${c.kind}${c.i}`] += val;
        });
        ws.getCell(r, yearlyCol).value = row.yearly_count || 0;
        totals.yearly += row.yearly_count || 0;

        for (let col = 1; col <= totalCols; col++) {
          const cell = ws.getCell(r, col);
          cell.border = border;
          if (col === yearlyCol) {
            cell.font = { size: 10, bold: true, color: { argb: YEARLY_BODY_TXT } };
            cell.fill = solid(YEARLY_BODY);
          } else if (quarterCols.has(col)) {
            cell.font = { size: 10, bold: true, color: { argb: QUARTER_BODY_TXT } };
            cell.fill = solid(QUARTER_BODY);
          } else {
            cell.font = { size: 10 };
          }
          if (col >= 3) cell.alignment = { horizontal: "center", vertical: "middle" };
          else cell.alignment = { vertical: "middle" };
        }
        ws.getRow(r).height = 20;
        r++;
      });
      // № + type name spanning the group
      ws.mergeCells(firstRow, 1, r - 1, 1);
      ws.mergeCells(firstRow, 2, r - 1, 2);
      const noCell = ws.getCell(firstRow, 1);
      noCell.value = typeIdx + 1;
      noCell.alignment = { horizontal: "center", vertical: "middle" };
      const typeCell = ws.getCell(firstRow, 2);
      typeCell.value = type.inspection_type.name;
      typeCell.font = { bold: true, size: 10 };
      typeCell.alignment = { horizontal: "left", vertical: "middle" };
    });

    // Totals row
    ws.mergeCells(r, 1, r, 3);
    const totalLabel = ws.getCell(r, 1);
    totalLabel.value = "Umumiy";
    totalLabel.font = { bold: true, size: 10 };
    totalLabel.alignment = { horizontal: "right", vertical: "middle" };
    COLS.forEach((c, ci) => {
      ws.getCell(r, 4 + ci).value = totals[`${c.kind}${c.i}`];
    });
    ws.getCell(r, yearlyCol).value = totals.yearly;
    for (let col = 1; col <= totalCols; col++) {
      const cell = ws.getCell(r, col);
      cell.border = border;
      cell.font = { bold: true, size: 10, color: { argb: col === yearlyCol ? YEARLY_BODY_TXT : col >= 4 && quarterCols.has(col) ? QUARTER_BODY_TXT : "FF0F172A" } };
      cell.fill = solid(col === yearlyCol ? YEARLY_TOTAL : quarterCols.has(col) ? QUARTER_TOTAL : TOTAL_BODY);
      if (col >= 4) cell.alignment = { horizontal: "center", vertical: "middle" };
      else cell.alignment = { horizontal: "right", vertical: "middle" };
    }
    ws.getRow(r).height = 22;

    // Column widths — roomier cells
    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 20;
    ws.getColumn(3).width = 20;
    for (let i = 0; i < COLS.length; i++) {
      ws.getColumn(4 + i).width = COLS[i].kind === "quarter" ? 9 : 8;
    }
    ws.getColumn(yearlyCol).width = 12;
  });

  if (report.organizations.length === 0) {
    wb.addWorksheet("Bo'sh");
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `texnik-koriklar-rejasi_${report.year}.xlsx`);
}
