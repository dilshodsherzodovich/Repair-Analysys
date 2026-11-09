"use client";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { LocomotiveGroup } from "@/app/bandages/[orgId]/components/bandages-table";
import {
  BANDAGE_GROUPS,
  OUT_OF_RANGE,
  bandageGroupKey,
} from "@/app/bandages/[orgId]/bandage-groups";

/**
 * Bandages workbook: the table as it is on screen (filters and the picked
 * group applied) plus a sheet of per-group counts. Styling follows the
 * duty-uzel export.
 */

type Translate = (key: string, values?: Record<string, unknown>) => string;

interface ExportContext {
  t: Translate;
  tModal: Translate;
  /** Group picked from the cards; its KPs are highlighted like on screen. */
  activeGroup: string | null;
}

const NAVY = "FF1E3A5F";
const SUB_HEADER = "FF334E73";
const HIGHLIGHT = "FFDBEAFE"; // blue-100
const HIGHLIGHT_TXT = "FF1E40AF"; // blue-800
const TOTAL_BAND = "FFE2E8F0"; // slate-200
const ZEBRA = "FFF8FAFC"; // slate-50
const MUTED_TXT = "FF94A3B8"; // slate-400
const INK = "FF0F172A"; // slate-900

const thin = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

const solid = (argb: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const DASH = "—";
const SIDES = ["left", "right"] as const;

function groupLabel(key: string, t: Translate) {
  return key === OUT_OF_RANGE ? t("group_out_of_range") : key;
}

function groupRange(key: string) {
  const group = BANDAGE_GROUPS.find((item) => item.key === key);
  return group ? `${group.min}–${group.max}` : DASH;
}

function fileName(name: string): string {
  return `${name.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 60)}_${format(
    new Date(),
    "yyyy-MM-dd",
  )}.xlsx`;
}

function writeTitle(
  ws: ExcelJS.Worksheet,
  columnCount: number,
  title: string,
  subtitle: string,
) {
  ws.mergeCells(1, 1, 1, columnCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 13, color: { argb: NAVY } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 26;

  ws.mergeCells(2, 1, 2, columnCount);
  const subtitleCell = ws.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { size: 10, italic: true, color: { argb: "FF64748B" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 18;
}

function styleHeaderCell(cell: ExcelJS.Cell, fill: string) {
  cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.fill = solid(fill);
  cell.border = border;
}

/** "Sana: 09.11.2026 • Guruh: 50 (49–55)" */
function subtitleFor({ t, activeGroup }: ExportContext) {
  const parts = [`${t("excel.date")}: ${format(new Date(), "dd.MM.yyyy")}`];
  if (activeGroup) {
    const range = groupRange(activeGroup);
    parts.push(
      `${t("excel.group")}: ${groupLabel(activeGroup, t)}${
        range === DASH ? "" : ` (${range})`
      }`,
    );
  }
  return parts.join("    •    ");
}

/** The bandage table: №, locomotive, section, then left/right per KP. */
function writeTableSheet(
  wb: ExcelJS.Workbook,
  groups: LocomotiveGroup[],
  componentNames: string[],
  context: ExportContext,
) {
  const { t, tModal, activeGroup } = context;
  const ws = wb.addWorksheet(t("excel.table_sheet").slice(0, 31) || "Bandages");
  const columnCount = 3 + componentNames.length * 2;

  writeTitle(ws, columnCount, t("title"), subtitleFor(context));

  // Two header rows: KP names over their Chap / O'ng pair
  const top = 3;
  const sub = 4;
  [t("columns.no"), t("columns.locomotive"), t("columns.section")].forEach(
    (label, index) => {
      ws.mergeCells(top, index + 1, sub, index + 1);
      const cell = ws.getCell(top, index + 1);
      cell.value = label;
      styleHeaderCell(cell, NAVY);
    },
  );
  componentNames.forEach((name, index) => {
    const col = 4 + index * 2;
    ws.mergeCells(top, col, top, col + 1);
    const cell = ws.getCell(top, col);
    cell.value = name;
    styleHeaderCell(cell, NAVY);
    SIDES.forEach((side, sideIndex) => {
      const sideCell = ws.getCell(sub, col + sideIndex);
      sideCell.value = tModal(side);
      styleHeaderCell(sideCell, SUB_HEADER);
    });
  });
  ws.getRow(top).height = 22;
  ws.getRow(sub).height = 18;

  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 12;
  for (let col = 4; col <= columnCount; col++) ws.getColumn(col).width = 9;
  ws.views = [{ state: "frozen", xSplit: 3, ySplit: sub }];

  let row = sub + 1;
  groups.forEach((group, groupIndex) => {
    const firstRow = row;
    const zebra = groupIndex % 2 === 1;

    group.sections.forEach((section) => {
      const values: (string | number)[] = [
        group.index,
        `${group.name}-${group.modelName}`,
        section.sectionName,
      ];
      values.forEach((value, index) => {
        const cell = ws.getCell(row, index + 1);
        cell.value = value;
        cell.font = { size: 10, color: { argb: INK }, bold: index === 1 };
        cell.alignment = {
          horizontal: index === 1 ? "left" : "center",
          vertical: "middle",
        };
        cell.border = border;
        if (zebra) cell.fill = solid(ZEBRA);
      });

      componentNames.forEach((name, index) => {
        const bandage = section.byComponent[name];
        const inActiveGroup =
          !!activeGroup && !!bandage && bandageGroupKey(bandage) === activeGroup;
        SIDES.forEach((side, sideIndex) => {
          const cell = ws.getCell(row, 4 + index * 2 + sideIndex);
          const value = bandage?.[side];
          if (value === null || value === undefined) {
            cell.value = DASH;
          } else {
            cell.value = value;
            cell.numFmt = "0.0";
          }
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = border;
          // Same reading as the screen: the picked group stands out, the rest fades
          if (inActiveGroup) {
            cell.font = { size: 10, bold: true, color: { argb: HIGHLIGHT_TXT } };
            cell.fill = solid(HIGHLIGHT);
          } else {
            cell.font = {
              size: 10,
              color: { argb: activeGroup ? MUTED_TXT : INK },
            };
            if (zebra) cell.fill = solid(ZEBRA);
          }
        });
      });
      row++;
    });

    // № and locomotive span the locomotive's section rows
    if (row - firstRow > 1) {
      ws.mergeCells(firstRow, 1, row - 1, 1);
      ws.mergeCells(firstRow, 2, row - 1, 2);
    }
  });

  if (groups.length === 0) {
    ws.mergeCells(row, 1, row, columnCount);
    const cell = ws.getCell(row, 1);
    cell.value = t("empty");
    cell.font = { size: 10, italic: true, color: { argb: MUTED_TXT } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = border;
  }
}

/** Per-group counts — what the cards show, for the listed locomotives. */
function writeGroupsSheet(
  wb: ExcelJS.Workbook,
  groups: LocomotiveGroup[],
  context: ExportContext,
) {
  const { t, activeGroup } = context;
  const ws = wb.addWorksheet(t("excel.groups_sheet").slice(0, 31) || "Groups");

  const kps = new Map<string, number>();
  const locomotives = new Map<string, Set<number>>();
  groups.forEach((group) =>
    group.bandages.forEach((bandage) => {
      const key = bandageGroupKey(bandage);
      if (!key) return;
      kps.set(key, (kps.get(key) ?? 0) + 1);
      if (!locomotives.has(key)) locomotives.set(key, new Set());
      locomotives.get(key)!.add(bandage.locomotive);
    }),
  );

  const keys: string[] = BANDAGE_GROUPS.map((group) => group.key);
  if (kps.has(OUT_OF_RANGE)) keys.push(OUT_OF_RANGE);

  const headers = [
    t("excel.group"),
    t("excel.range"),
    t("excel.kp_count"),
    t("excel.locomotive_count"),
  ];
  writeTitle(ws, headers.length, t("title"), subtitleFor(context));
  headers.forEach((label, index) => {
    const cell = ws.getCell(3, index + 1);
    cell.value = label;
    styleHeaderCell(cell, NAVY);
  });
  ws.getRow(3).height = 24;
  [12, 14, 14, 18].forEach((width, index) => {
    ws.getColumn(index + 1).width = width;
  });

  let row = 4;
  keys.forEach((key, index) => {
    const values = [
      groupLabel(key, t),
      groupRange(key),
      kps.get(key) ?? 0,
      locomotives.get(key)?.size ?? 0,
    ];
    const isActive = key === activeGroup;
    values.forEach((value, col) => {
      const cell = ws.getCell(row, col + 1);
      cell.value = value;
      cell.font = {
        size: 10,
        bold: isActive || col === 0,
        color: { argb: isActive ? HIGHLIGHT_TXT : INK },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = border;
      if (isActive) cell.fill = solid(HIGHLIGHT);
      else if (index % 2 === 1) cell.fill = solid(ZEBRA);
    });
    row++;
  });

  // Total of KPs; locomotives are not summed since one can sit in several groups
  const total = Array.from(kps.values()).reduce((sum, count) => sum + count, 0);
  ws.mergeCells(row, 1, row, 2);
  [t("excel.total"), "", total, ""].forEach((value, col) => {
    const cell = ws.getCell(row, col + 1);
    if (value !== "") cell.value = value;
    cell.font = { size: 10, bold: true, color: { argb: INK } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = solid(TOTAL_BAND);
    cell.border = border;
  });
}

export async function exportBandagesExcel(
  {
    visibleGroups,
    allGroups,
    componentNames,
  }: {
    /** Rows of the table on screen (narrowed to the picked group). */
    visibleGroups: LocomotiveGroup[];
    /** Every listed locomotive, so the counts match the cards. */
    allGroups: LocomotiveGroup[];
    componentNames: string[];
  },
  context: ExportContext,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Repair Analysys";

  writeTableSheet(wb, visibleGroups, componentNames, context);
  writeGroupsSheet(wb, allGroups, context);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const suffix = context.activeGroup
    ? `-${groupLabel(context.activeGroup, context.t)}`
    : "";
  saveAs(blob, fileName(`${context.t("title")}${suffix}`));
}
