"use client";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import {
  ComponentGroupDetails,
  ComponentGroupOverview,
  ComponentRegistryEntry,
} from "@/api/types/component-registry";

/**
 * Styled workbooks for the duty-uzel screens. Built on ExcelJS (like the annual
 * plan export) so the files carry real formatting: titles, filled headers,
 * borders, frozen panes, zebra rows and sensible column widths.
 */

type Translate = (key: string, values?: Record<string, unknown>) => string;

interface ExportContext {
  t: Translate;
  startDate?: string;
  endDate?: string;
}

// Colour language, shared with the annual plan export
const NAVY = "FF1E3A5F";
const GROUP_BAND = "FFDBEAFE"; // blue-100
const GROUP_BAND_TXT = "FF1E40AF"; // blue-800
const COMPONENT_BAND = "FFEFF6FF"; // blue-50
const TOTAL_BAND = "FFE2E8F0"; // slate-200
const ZEBRA = "FFF8FAFC"; // slate-50
const MUTED_TXT = "FF64748B"; // slate-500
const INK = "FF0F172A"; // slate-900

const thin = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

const solid = (argb: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const DASH = "—";

/** dd.MM.yyyy, matching the tables on screen. */
function formatDate(value?: string | null): string {
  if (!value) return DASH;
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return format(date, "dd.MM.yyyy");
}

function locomotiveLabel(name?: string | null, model?: string | null): string {
  if (!name) return DASH;
  return model ? `${name}-${model}` : name;
}

/** "Davr: 01.05.2026 – 31.07.2026", or the all-time label when unfiltered. */
function periodLabel({ t, startDate, endDate }: ExportContext): string {
  const label = t("excel.period");
  if (!startDate && !endDate) return `${label}: ${t("excel.all_dates")}`;
  return `${label}: ${formatDate(startDate)} – ${formatDate(endDate)}`;
}

/** Excel forbids \ / * ? : [ ] in sheet names, and caps them at 31 chars. */
function sheetName(name: string, fallback: string): string {
  const cleaned = (name || "").replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31);
  return cleaned || fallback;
}

function fileName(name: string): string {
  return `${name.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 60)}_${format(
    new Date(),
    "yyyy-MM-dd",
  )}.xlsx`;
}

interface Column {
  header: string;
  width: number;
  /** Centred by default; long free text reads better left-aligned and wrapped. */
  align?: "left" | "center";
  wrap?: boolean;
}

/** Title + period rows above the table, spanning every column. */
function writeTitle(
  ws: ExcelJS.Worksheet,
  columnCount: number,
  title: string,
  subtitle: string,
  note?: string,
) {
  ws.mergeCells(1, 1, 1, columnCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 13, color: { argb: NAVY } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 26;

  ws.mergeCells(2, 1, 2, columnCount);
  const subtitleCell = ws.getCell(2, 1);
  subtitleCell.value = note ? `${subtitle}    •    ${note}` : subtitle;
  subtitleCell.font = { size: 10, italic: true, color: { argb: MUTED_TXT } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 18;
}

/** Header row, navy filled, frozen so it stays visible while scrolling. */
function writeHeader(
  ws: ExcelJS.Worksheet,
  columns: Column[],
  rowIndex: number,
) {
  columns.forEach((column, index) => {
    const cell = ws.getCell(rowIndex, index + 1);
    cell.value = column.header;
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.fill = solid(NAVY);
    cell.border = border;
    ws.getColumn(index + 1).width = column.width;
  });
  ws.getRow(rowIndex).height = 32;
  ws.views = [{ state: "frozen", ySplit: rowIndex }];
}

/** One body row: values in order, with borders, alignment and zebra striping. */
function writeBodyRow(
  ws: ExcelJS.Worksheet,
  columns: Column[],
  rowIndex: number,
  values: (string | number)[],
  zebra: boolean,
) {
  columns.forEach((column, index) => {
    const cell = ws.getCell(rowIndex, index + 1);
    cell.value = values[index] ?? DASH;
    cell.font = { size: 10, color: { argb: INK } };
    cell.alignment = {
      horizontal: column.align ?? "center",
      vertical: "middle",
      wrapText: column.wrap ?? false,
    };
    cell.border = border;
    if (zebra) cell.fill = solid(ZEBRA);
  });
}

/** Full-width band row used for group / component headings and totals. */
function writeBandRow(
  ws: ExcelJS.Worksheet,
  columnCount: number,
  rowIndex: number,
  label: string,
  count: number | null,
  fill: string,
  textColor: string,
) {
  ws.mergeCells(rowIndex, 1, rowIndex, Math.max(1, columnCount - 1));
  const labelCell = ws.getCell(rowIndex, 1);
  labelCell.value = label;
  labelCell.font = { bold: true, size: 11, color: { argb: textColor } };
  labelCell.alignment = { horizontal: "left", vertical: "middle" };

  const countCell = ws.getCell(rowIndex, columnCount);
  if (count !== null) countCell.value = count;
  countCell.font = { bold: true, size: 11, color: { argb: textColor } };
  countCell.alignment = { horizontal: "center", vertical: "middle" };

  for (let col = 1; col <= columnCount; col++) {
    const cell = ws.getCell(rowIndex, col);
    cell.fill = solid(fill);
    cell.border = border;
  }
  ws.getRow(rowIndex).height = 22;
}

async function download(wb: ExcelJS.Workbook, name: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, fileName(name));
}

/** Columns shared by the group detail sheet and the flat registry sheet. */
function defectColumns(t: Translate, withComponent: boolean): Column[] {
  return [
    { header: t("columns.no"), width: 6 },
    { header: t("columns.defect_date"), width: 14 },
    ...(withComponent
      ? [{ header: t("columns.component"), width: 26, align: "left" as const }]
      : []),
    { header: t("columns.locomotive"), width: 18 },
    { header: t("columns.section"), width: 14 },
    { header: t("columns.reason"), width: 42, align: "left", wrap: true },
    { header: t("columns.removed_manufacture_year"), width: 16 },
    { header: t("columns.removed_manufacture_factory"), width: 18 },
    { header: t("columns.installed_manufacture_year"), width: 16 },
    { header: t("columns.installed_manufacture_factory"), width: 18 },
    { header: t("columns.staff"), width: 22, align: "left" },
  ];
}

/**
 * Group view summary: every group with its components and defect counts.
 */
export async function exportComponentGroupOverviewExcel(
  overview: ComponentGroupOverview,
  context: ExportContext,
) {
  const { t } = context;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Repair Analysys";
  const ws = wb.addWorksheet(sheetName(t("excel.groups_sheet"), "Groups"));

  const columns: Column[] = [
    { header: t("columns.no"), width: 6 },
    { header: t("group_filter_label"), width: 38, align: "left" },
    { header: t("columns.component"), width: 42, align: "left" },
    { header: t("columns.count"), width: 12 },
    { header: t("excel.group_total_column"), width: 14 },
  ];
  const groupTotalColumn = columns.length;

  writeTitle(
    ws,
    columns.length,
    `${t("title")} — ${t("groups_title")}`,
    periodLabel(context),
    t("group_total", { count: overview.count ?? 0 }),
  );
  writeHeader(ws, columns, 3);

  let row = 4;
  overview.groups.forEach((group, groupIndex) => {
    const firstRow = row;
    const components = group.components ?? [];

    const rows =
      components.length === 0
        ? [[groupIndex + 1, group.name, DASH, group.count, group.count]]
        : components.map((component, componentIndex) => [
            componentIndex === 0 ? groupIndex + 1 : "",
            componentIndex === 0 ? group.name : "",
            component.name,
            component.count,
            componentIndex === 0 ? group.count : "",
          ]);

    rows.forEach((values) => {
      writeBodyRow(ws, columns, row, values, groupIndex % 2 === 1);
      row++;
    });

    // №, group name and the group's own total each span the group's rows
    if (row - firstRow > 1) {
      ws.mergeCells(firstRow, 1, row - 1, 1);
      ws.mergeCells(firstRow, 2, row - 1, 2);
      ws.mergeCells(firstRow, groupTotalColumn, row - 1, groupTotalColumn);
    }

    const nameCell = ws.getCell(firstRow, 2);
    nameCell.font = { size: 10, bold: true, color: { argb: INK } };
    nameCell.alignment = { horizontal: "left", vertical: "middle" };

    const totalCell = ws.getCell(firstRow, groupTotalColumn);
    totalCell.font = { size: 10, bold: true, color: { argb: GROUP_BAND_TXT } };
    totalCell.fill = solid(COMPONENT_BAND);
    totalCell.alignment = { horizontal: "center", vertical: "middle" };
  });

  writeBandRow(
    ws,
    columns.length,
    row,
    t("excel.total"),
    overview.count ?? 0,
    TOTAL_BAND,
    INK,
  );

  await download(wb, `${t("title")}-${t("groups_title")}`);
}

/**
 * One group: its components as banded sections, each followed by its defects.
 */
export async function exportComponentGroupDetailsExcel(
  details: ComponentGroupDetails,
  context: ExportContext,
) {
  const { t } = context;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Repair Analysys";
  const groupName = details.group?.name ?? "";
  const ws = wb.addWorksheet(sheetName(groupName, "Group"));

  const columns = defectColumns(t, false);

  writeTitle(
    ws,
    columns.length,
    groupName || t("groups_title"),
    periodLabel(context),
    t("group_total", { count: details.total_count ?? 0 }),
  );
  writeHeader(ws, columns, 3);

  let row = 4;
  (details.components ?? []).forEach((component) => {
    writeBandRow(
      ws,
      columns.length,
      row,
      component.name,
      component.count,
      GROUP_BAND,
      GROUP_BAND_TXT,
    );
    row++;

    if (component.registries.length === 0) {
      ws.mergeCells(row, 1, row, columns.length);
      const cell = ws.getCell(row, 1);
      cell.value = t("empty_description");
      cell.font = { size: 10, italic: true, color: { argb: MUTED_TXT } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = border;
      row++;
      return;
    }

    component.registries.forEach((registry, index) => {
      writeBodyRow(
        ws,
        columns,
        row,
        [
          index + 1,
          formatDate(registry.defect_date),
          locomotiveLabel(registry.locomotive, registry.locomotive_model),
          registry.section || DASH,
          registry.reason || DASH,
          registry.removed_manufacture_year || DASH,
          registry.removed_manufacture_factory || DASH,
          registry.installed_manufacture_year || DASH,
          registry.installed_manufacture_factory || DASH,
          registry.staff || DASH,
        ],
        index % 2 === 1,
      );
      row++;
    });
  });

  writeBandRow(
    ws,
    columns.length,
    row,
    t("excel.total"),
    details.total_count ?? 0,
    TOTAL_BAND,
    INK,
  );

  await download(wb, groupName || "duty-uzel-group");
}

/**
 * The classic list view: one flat, filterable sheet of registry rows.
 */
export async function exportComponentRegistryListExcel(
  rows: ComponentRegistryEntry[],
  context: ExportContext,
) {
  const { t } = context;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Repair Analysys";
  const ws = wb.addWorksheet(sheetName(t("excel.list_sheet"), "List"));

  const columns: Column[] = [
    { header: t("columns.no"), width: 6 },
    { header: t("columns.defect_date"), width: 14 },
    { header: t("columns.organization"), width: 24, align: "left" },
    { header: t("columns.inspection"), width: 18, align: "left" },
    { header: t("columns.locomotive"), width: 18 },
    { header: t("columns.component"), width: 26, align: "left" },
    { header: t("columns.section"), width: 14 },
    { header: t("columns.reason"), width: 42, align: "left", wrap: true },
    { header: t("columns.removed_manufacture_year"), width: 16 },
    { header: t("columns.removed_manufacture_factory"), width: 18 },
    { header: t("columns.installed_manufacture_year"), width: 16 },
    { header: t("columns.installed_manufacture_factory"), width: 18 },
  ];

  writeTitle(
    ws,
    columns.length,
    t("title"),
    periodLabel(context),
    t("group_total", { count: rows.length }),
  );
  writeHeader(ws, columns, 3);

  rows.forEach((entry, index) => {
    writeBodyRow(
      ws,
      columns,
      index + 4,
      [
        index + 1,
        formatDate(entry.defect_date),
        entry.organization || DASH,
        entry.inspection || DASH,
        locomotiveLabel(entry.locomotive, entry.loc_model_name),
        entry.component || DASH,
        entry.section || DASH,
        entry.reason || DASH,
        entry.removed_manufacture_year || DASH,
        entry.removed_manufacture_factory || DASH,
        entry.installed_manufacture_year || DASH,
        entry.installed_manufacture_factory || DASH,
      ],
      index % 2 === 1,
    );
  });

  // No merged cells here, so the header can carry a filter
  ws.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3 + rows.length, column: columns.length },
  };

  await download(wb, t("title"));
}
