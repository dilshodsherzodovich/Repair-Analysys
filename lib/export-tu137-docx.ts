import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import { Tu137Record } from "@/api/types/tu137";
import { formatDate } from "@/lib/utils"; // Assuming it formats properly

export async function exportTu137ToDocx(records: Tu137Record[]) {
  // Sort records if needed
  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(a.create_date).getTime() - new Date(b.create_date).getTime(),
  );

  // Main table rows
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ text: "№", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 5, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: "Sana", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: "Korxona", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: "Sana", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: "Mazmuni", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 45, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({
              text: "Biriktirilgan",
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: "Holati", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    ...sortedRecords.map((r, index) => {
      const isSolved = r.status_id === 4;
      const formattedDate =
        formatDate(r.create_date).split(" ")[0] || r.create_date;

      const parts = [];
      if (r.lokomotiv_name) parts.push(`Teplovoz ${r.lokomotiv_name}`);
      if (r.poezd_number) parts.push(`Poyezd №${r.poezd_number}`);
      if (r.station_name || r.station2_name) {
        let st = r.station_name || "";
        if (r.station2_name) st += ` - ${r.station2_name}`;
        parts.push(`peregon ${st}`);
      }
      if (r.km_picket) parts.push(r.km_picket);

      const startText = parts.length > 0 ? parts.join(" ") + " " : "";

      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                text: `${index + 1}.`,
                alignment: AlignmentType.CENTER,
              }),
            ],
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formattedDate,
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: r.group_name || "",
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formattedDate,
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: startText }),
                  new TextRun({ text: r.comments || "" }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Mashinist ${r.mashinist_fio || ""}`,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: r.organization_name || r.group_name || "",
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: isSolved ? "Bajarildi" : "",
                    bold: isSolved,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      });
    }),
  ];

  // Month Statistics
  const monthStatsMap = new Map<
    string,
    { total: number; solved: number; open: number }
  >();
  records.forEach((r) => {
    const d = new Date(r.create_date);
    const m = d.getMonth();
    const isSolved = r.status_id === 4;
    const key = `${m}`;
    if (!monthStatsMap.has(key))
      monthStatsMap.set(key, { total: 0, solved: 0, open: 0 });
    const stat = monthStatsMap.get(key)!;
    stat.total++;
    if (isSolved) stat.solved++;
    else stat.open++;
  });

  const monthNames = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
  ];
  const statRows = Array.from(monthStatsMap.entries())
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([mStr, stat]) => {
      const mName = monthNames[parseInt(mStr)];
      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                text: `${mName} oyida kamchiliklar soni - ${stat.total} ta.`,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: `shulardan javobi berilganlar soni - ${stat.solved} ta.`,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: `javobi berilmaganlar soni - ${stat.open} ta.`,
              }),
            ],
          }),
        ],
      });
    });

  // Department Table
  const openByDept = new Map<string, number>();
  records.forEach((r) => {
    if (r.status_id !== 4) {
      const dept = r.organization_name || r.group_name || "Boshqa";
      openByDept.set(dept, (openByDept.get(dept) || 0) + 1);
    }
  });

  const depts = Array.from(openByDept.keys());

  const deptTableRows = [];
  if (depts.length > 0) {
    deptTableRows.push(
      new TableRow({
        children: depts.map(
          (d) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: d,
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
        ),
      }),
      new TableRow({
        children: depts.map((d) => {
          const count = openByDept.get(d) || 0;
          return new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: count.toString(),
                    color: count > 0 ? "FF0000" : "000000",
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          });
        }),
      }),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 500,
              right: 500,
              bottom: 500,
              left: 500,
            },
          },
        },
        children: [
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }), // Space
          ...(statRows.length > 0
            ? [
                new Table({
                  rows: statRows,
                  width: { size: 100, type: WidthType.PERCENTAGE },
                }),
                new Paragraph({ text: "" }),
              ]
            : []),
          ...(deptTableRows.length > 0
            ? [
                new Table({
                  rows: deptTableRows,
                  width: { size: 100, type: WidthType.PERCENTAGE },
                }),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Mashinist_Etirozlar_${Date.now()}.docx`);
}
