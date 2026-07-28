import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  HeightRule,
} from "docx";
import { saveAs } from "file-saver";
import { Inspection } from "@/api/types/report-inspection";
import { format } from "date-fns";
import { uz, ru } from "date-fns/locale";
import uzMessages from "@/messages/uz.json";
import ruMessages from "@/messages/ru.json";

export interface LocomotiveInspectionsDocxData {
  inspections: Inspection[];
  locomotiveName: string;
  startDate: Date;
  endDate: Date;
  locale: string;
}

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "d0d0d8" };

function makeCell(
  text: string,
  opts: {
    bold?: boolean;
    fill?: string;
    textColor?: string;
    center?: boolean;
    colSpan?: number;
    widthPct?: number;
  } = {}
) {
  return new TableCell({
    columnSpan: opts.colSpan,
    width: opts.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill, color: "auto" } : undefined,
    borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold ?? false,
            color: opts.textColor ?? "111111",
            size: 16,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

export async function generateLocomotiveInspectionsDocx(
  data: LocomotiveInspectionsDocxData
) {
  const isRu = data.locale === "ru";
  const msgs = isRu ? ruMessages : uzMessages;
  const t = msgs.Inspects;
  const dateLocale = isRu ? ru : uz;

  const title = msgs.LocomotiveHistory.timelineTitle;
  const fmtDisplay = (d: Date) => format(d, "dd MMM yyyy", { locale: dateLocale });
  const dateRange = `${fmtDisplay(data.startDate)} – ${fmtDisplay(data.endDate)}`;

  // Group by date
  const inspectionsByDate: Record<string, Inspection[]> = {};
  data.inspections.forEach((ins) => {
    const key = format(new Date(ins.created_time), "dd MMM yyyy", { locale: dateLocale });
    if (!inspectionsByDate[key]) inspectionsByDate[key] = [];
    inspectionsByDate[key].push(ins);
  });

  const sortedDates = Object.keys(inspectionsByDate).sort(
    (a, b) =>
      new Date(inspectionsByDate[a][0].created_time).getTime() -
      new Date(inspectionsByDate[b][0].created_time).getTime()
  );

  const headers = [t.time, t.inspectionType, t.status, t.branch, t.location, t.author];
  const colWidths = [10, 20, 12, 16, 16, 20];

  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    height: { value: 400, rule: HeightRule.ATLEAST },
    children: headers.map((h, i) =>
      makeCell(h, {
        bold: true,
        fill: "294169",
        textColor: "FFFFFF",
        center: i === 0 || i === 2,
        widthPct: colWidths[i],
      })
    ),
  });

  const tableRows: TableRow[] = [headerRow];

  sortedDates.forEach((dateStr) => {
    const rows = inspectionsByDate[dateStr]
      .slice()
      .sort((a, b) => new Date(a.created_time).getTime() - new Date(b.created_time).getTime());

    // Date group spanning row
    tableRows.push(
      new TableRow({
        height: { value: 360, rule: HeightRule.ATLEAST },
        children: [
          makeCell(dateStr, { bold: true, fill: "e4e9f8", textColor: "19326e", colSpan: 6 }),
        ],
      })
    );

    rows.forEach((ins) => {
      const status = ins.is_cancelled ? t.canceled : ins.is_closed ? t.closed : t.open;
      const author = ins.author
        ? `${ins.author.first_name} ${ins.author.last_name}`.trim()
        : "-";
      const cells = [
        format(new Date(ins.created_time), "HH:mm"),
        ins.inspection_type?.name || "-",
        status,
        ins.branch?.name || "-",
        ins.locomotive?.location?.name || "-",
        author,
      ];

      tableRows.push(
        new TableRow({
          height: { value: 320, rule: HeightRule.ATLEAST },
          children: cells.map((val, ci) =>
            makeCell(val, { center: ci === 0 || ci === 2, widthPct: colWidths[ci] })
          ),
        })
      );
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  const fmtFile = (d: Date) => format(d, "dd-MM-yyyy");

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 11906 }, // A4 landscape in twips
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: title, bold: true, size: 24, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${data.locomotiveName}   |   ${dateRange}`,
                color: "666666",
                size: 16,
                font: "Calibri",
              }),
            ],
          }),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(
    blob,
    `locomotive-inspections_${data.locomotiveName.replace(/\s+/g, "_")}_${fmtFile(data.startDate)}_${fmtFile(data.endDate)}.docx`
  );
}
