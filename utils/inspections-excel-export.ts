"use client";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import { Inspection } from "@/api/types/report-inspection";

export interface InspectionExcelTranslations {
  num: string;
  locomotive: string;
  inspectionType: string;
  xkp: string;
  section: string;
  author: string;
  createdTime: string;
  closedTime: string;
  canceledTime: string;
  lastUpdated: string;
  inspectionStartMileage: string;
  interval: string;
  comment: string;
  total: string;
  exportDate: string;
  period: string;
  sectionNames: (section: string | null) => string;
}

export interface InspectionExcelData {
  inspections: Inspection[];
  startDate?: string;
  endDate?: string;
  title?: string;
  status?: "in_progress" | "closed" | "cancelled";
  exportDate?: string;
  translations: InspectionExcelTranslations;
}

const border = {
  top: { style: "thin" as const },
  left: { style: "thin" as const },
  bottom: { style: "thin" as const },
  right: { style: "thin" as const },
};

const navyFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E3A5F" },
};

const blueFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFDBEAFE" },
};

const altFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF0F6FF" },
};

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function generateInspectionsExcel(data: InspectionExcelData) {
  const tr = data.translations;
  const { status, inspections } = data;

  const endTimeHeader =
    status === "cancelled"
      ? tr.canceledTime
      : status === "closed"
      ? tr.closedTime
      : tr.lastUpdated;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dejurniy";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Tekshiruvlar");

  const COLS = 11;

  ws.columns = [
    { width: 6 },   // №
    { width: 22 },  // Lokomotiv
    { width: 22 },  // Tekshiruv turi
    { width: 30 },  // XKP / ПТОЛ
    { width: 10 },  // Sektsiya
    { width: 24 },  // Muallif
    { width: 22 },  // Boshlangan vaqt
    { width: 22 },  // Yopilgan/Bekor qilingan vaqt
    { width: 22 },  // Bosib o'tgan masofasi (fakt)
    { width: 16 },  // Interval
    { width: 32 },  // Izoh
  ];

  // ─── Title ────────────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, COLS);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = data.title || "Tekshiruvlar";
  titleCell.font = { size: 15, bold: true, color: { argb: "FF1E3A5F" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 34;

  // ─── Meta row ─────────────────────────────────────────────────────────────
  ws.mergeCells(2, 1, 2, COLS);
  const metaCell = ws.getCell(2, 1);
  const parts: string[] = [];
  if (data.exportDate) parts.push(`${tr.exportDate}: ${data.exportDate}`);
  if (data.startDate && data.endDate)
    parts.push(`${tr.period}: ${data.startDate} – ${data.endDate}`);
  parts.push(`${tr.total}: ${inspections.length}`);
  metaCell.value = parts.join("   |   ");
  metaCell.font = { size: 11, italic: true, color: { argb: "FF374151" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 20;

  ws.getRow(3).height = 6; // spacer

  // ─── Table header ─────────────────────────────────────────────────────────
  const headerLabels = [
    tr.num,
    tr.locomotive,
    tr.inspectionType,
    tr.xkp,
    tr.section,
    tr.author,
    tr.createdTime,
    endTimeHeader,
    tr.inspectionStartMileage,
    tr.interval,
    tr.comment,
  ];

  const headerRow = ws.getRow(4);
  headerRow.height = 38;
  headerLabels.forEach((label, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = label;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = navyFill;
    cell.border = border;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  // ─── Data rows ────────────────────────────────────────────────────────────
  inspections.forEach((ins, idx) => {
    const row = ws.getRow(5 + idx);
    row.height = 22;

    const locoName =
      ins.external_locomotive?.toString() ||
      [ins.locomotive?.name, ins.locomotive?.locomotive_model?.name]
        .filter(Boolean)
        .join(" ") ||
      "-";

    const authorName = ins.author
      ? `${ins.author.first_name ?? ""} ${ins.author.last_name ?? ""}`.trim() ||
        ins.author.username ||
        "-"
      : "-";

    const endedTime =
      status === "cancelled"
        ? formatDateTime(ins.is_cancelled_time)
        : status === "closed"
        ? formatDateTime(ins.is_closed_time)
        : "-"

    const values: (string | number)[] = [
      idx + 1,
      locoName,
      ins.inspection_type?.name ?? "-",
      ins.branch?.name ?? "-",
      data.translations.sectionNames(ins.section || null) ?? "-",
      authorName,
      formatDateTime(ins.created_time),
      endedTime,
      ins.inspection_start_mileage ?? "-",
      ins.mileage_interval ?? "-",
      ins.comment || "-",
    ];

    const isAlt = idx % 2 === 1;

    values.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.border = border;
      cell.font = { size: 10 };
      if (isAlt) cell.fill = altFill;
      cell.alignment = {
        horizontal: colIdx === 0 ? "center" : colIdx === 10 ? "left" : "center",
        vertical: "middle",
        wrapText: colIdx === 10,
      };
    });
  });

  // ─── Summary footer ───────────────────────────────────────────────────────
  const footerRowNum = 5 + inspections.length;
  ws.mergeCells(footerRowNum, 1, footerRowNum, COLS);
  const footerCell = ws.getCell(footerRowNum, 1);
  footerCell.value = `${tr.total}: ${inspections.length}`;
  footerCell.font = { bold: true, size: 11, color: { argb: "FF1E3A5F" } };
  footerCell.fill = blueFill;
  footerCell.border = border;
  footerCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(footerRowNum).height = 24;

  // ─── Save ─────────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const safeTitle = (data.title || "tekshiruvlar")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_");
  const dateStr = data.exportDate?.replace(/\./g, "-") || new Date().toISOString().slice(0, 10);
  saveAs(blob, `${safeTitle}_${dateStr}.xlsx`);
}
