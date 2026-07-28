/** @jsxRuntime classic */
/** @jsx React.createElement */
"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import type { PDFExportData } from "./pdf-export";
import { formatDate } from "./formatDate";

Font.register({
  family: "Roboto",
  src: "/Roboto-Regular.ttf",
});

const s = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 8,
    padding: 16,
    color: "#111",
  },
  title: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 3,
  },
  meta: {
    fontSize: 8,
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
  },
  sectionHeader: {
    backgroundColor: "#e8eaed",
    padding: "4 6",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "center",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginTop: 8,
  },
  table: {
    width: "100%",
  },
  thead: {
    flexDirection: "row",
    backgroundColor: "#294169",
  },
  th: {
    flex: 1,
    color: "white",
    padding: "4 5",
    fontSize: 7,
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5 solid #e0e0e0",
  },
  rowAlt: {
    backgroundColor: "#f8f9fc",
  },
  td: {
    flex: 1,
    padding: "3 5",
    fontSize: 8,
  },
  tdCenter: {
    flex: 1,
    padding: "3 5",
    fontSize: 8,
    textAlign: "center",
  },
  threeColGrid: {
    flexDirection: "row",
    gap: 4,
    marginTop: 0,
  },
  threeColItem: {
    flex: 1,
  },
  repairGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  repairBlock: {
    flex: 1,
    minWidth: "30%",
  },
  repairBlockHeader: {
    backgroundColor: "#dce3f0",
    padding: "3 5",
    fontSize: 7,
    textAlign: "center",
    fontWeight: "bold",
  },
  repairRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #e0e0e0",
  },
  repairTd: {
    flex: 1,
    padding: "2 4",
    fontSize: 7,
  },
});

type Tr = Record<string, string>;

function SimpleTable({
  headers,
  rows,
  colFlex,
  centerCols,
}: {
  headers: string[];
  rows: string[][];
  colFlex?: number[];
  centerCols?: number[];
}) {
  return (
    <View style={s.table}>
      <View style={s.thead}>
        {headers.map((h, i) => (
          <Text
            key={i}
            style={[s.th, { flex: colFlex?.[i] ?? 1, textAlign: centerCols?.includes(i) ? "center" : "left" }]}
          >
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={[s.row, ri % 2 !== 0 ? s.rowAlt : {}]}>
          {row.map((cell, ci) => (
            <Text
              key={ci}
              style={[
                s.td,
                { flex: colFlex?.[ci] ?? 1 },
                centerCols?.includes(ci) ? { textAlign: "center" } : {},
              ]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function RepairSection({
  title,
  groups,
  tr,
}: {
  title: string;
  groups: PDFExportData["electricRepair"];
  tr: Tr;
}) {
  if (!groups?.length) return null;
  return (
    <View>
      <Text style={s.sectionHeader}>{title}</Text>
      <View style={s.repairGrid}>
        {groups.map((group, gi) => (
          <View key={gi} style={s.repairBlock}>
            <Text style={s.repairBlockHeader}>{group.name}</Text>
            <View style={[s.repairRow, { backgroundColor: "#294169" }]}>
              <Text style={[s.repairTd, { flex: 1, color: "white", fontSize: 7 }]}>{tr.locomotive ?? "Lokomotiv"}</Text>
              <Text style={[s.repairTd, { flex: 1.5, color: "white", fontSize: 7 }]}>{tr.entered ?? "Kirdi"}</Text>
              <Text style={[s.repairTd, { flex: 1.5, color: "white", fontSize: 7 }]}>{tr.exited ?? "Chiqdi"}</Text>
            </View>
            {group.locomotives.map((loco, li) => (
              <View key={li} style={[s.repairRow, li % 2 !== 0 ? s.rowAlt : {}]}>
                <Text style={[s.repairTd, { flex: 1 }]}>{loco.name}</Text>
                <Text style={[s.repairTd, { flex: 1.5 }]}>
                  {formatDate(loco.inspection_started_time)}
                </Text>
                <Text style={[s.repairTd, { flex: 1.5 }]}>
                  {loco.inspection_closed_time ? formatDate(loco.inspection_closed_time) : "-"}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function DelayedSection({
  title,
  groups,
  tr,
}: {
  title: string;
  groups: PDFExportData["delayedLocomotives"];
  tr: Tr;
}) {
  if (!groups?.length) return null;

  const trainTypeName = (name: string) => {
    if (name === "electric_freight_locos") return tr.freightLocos ?? "Elektrovoz-yuk";
    if (name === "electric_switches_locos") return tr.switcherLocos ?? "Elektrovoz-manyovr";
    if (name === "passenger_locos") return tr.passengerLocs ?? "Yo'lovchi";
    return tr.dieselLocs ?? "Teplovoz";
  };

  return (
    <View>
      <Text style={s.sectionHeader}>{title}</Text>
      {groups.map((trainType, ti) => (
        <View key={ti}>
          <Text style={[s.repairBlockHeader, { marginTop: 4, textAlign: "left", paddingLeft: 6 }]}>
            {trainTypeName(trainType.name)}
          </Text>
          <View style={s.repairGrid}>
            {trainType.inspection_types
              .filter((type) => type.locomotives.length > 0)
              .map((type, idx) => (
                <View key={idx} style={s.repairBlock}>
                  <Text style={s.repairBlockHeader}>{type.name}</Text>
                  <View style={[s.repairRow, { backgroundColor: "#294169" }]}>
                    <Text style={[s.repairTd, { flex: 1, color: "white", fontSize: 7 }]}>{tr.locomotive ?? "Lokomotiv"}</Text>
                    <Text style={[s.repairTd, { flex: 1.5, color: "white", fontSize: 7 }]}>{tr.hourKm ?? "Soat / Km"}</Text>
                  </View>
                  {type.locomotives.map((loc, li) => (
                    <View key={li} style={[s.repairRow, li % 2 !== 0 ? s.rowAlt : {}]}>
                      <Text style={[s.repairTd, { flex: 1 }]}>{loc.name}</Text>
                      <Text style={[s.repairTd, { flex: 1.5 }]}>
                        {loc.hour} {(tr.hour ?? "Soat").toLowerCase()} / {loc.mileage} {(tr.km ?? "km").toLowerCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function ReservedSection({
  title,
  data,
  tr,
}: {
  title: string;
  data: PDFExportData["reservedLocomotives"];
  tr: Tr;
}) {
  const entries = Object.entries(data || {});
  if (!entries.length) return null;
  return (
    <View>
      <Text style={s.sectionHeader}>{title}</Text>
      <View style={s.repairGrid}>
        {entries.map(([groupName, locos], gi) => (
          <View key={gi} style={s.repairBlock}>
            <Text style={s.repairBlockHeader}>{groupName}</Text>
            <View style={[s.repairRow, { backgroundColor: "#294169" }]}>
              <Text style={[s.repairTd, { flex: 1, color: "white", fontSize: 7 }]}>{tr.locomotive ?? "Lokomotiv"}</Text>
              <Text style={[s.repairTd, { flex: 1.5, color: "white", fontSize: 7 }]}>{tr.entered ?? "Kirdi"}</Text>
              <Text style={[s.repairTd, { flex: 1.5, color: "white", fontSize: 7 }]}>{tr.exited ?? "Chiqdi"}</Text>
            </View>
            {locos.map((loco, li) => (
              <View key={li} style={[s.repairRow, li % 2 !== 0 ? s.rowAlt : {}]}>
                <Text style={[s.repairTd, { flex: 1 }]}>{loco.loco_name}</Text>
                <Text style={[s.repairTd, { flex: 1.5 }]}>
                  {loco.reserve_started_time ? formatDate(loco.reserve_started_time) : "-"}
                </Text>
                <Text style={[s.repairTd, { flex: 1.5 }]}>
                  {loco.reserve_closed_time ? formatDate(loco.reserve_closed_time) : "-"}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportDocument({ data }: { data: PDFExportData }) {
  const tr = data.translations;

  const locomotiveSection = (title: string, rows: PDFExportData["activeLocomotives"]) => {
    if (!rows?.length) return null;
    return (
      <View>
        <Text style={s.sectionHeader}>{title}</Text>
        <SimpleTable
          headers={[tr.station ?? "Stansiya", tr.locomotives ?? "Lokomotivlar", tr.total ?? "Jami"]}
          rows={rows.map((r) => [r.name, r.codes, r.total])}
          colFlex={[1, 3, 0.6]}
          centerCols={[2]}
        />
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>{data.title}</Text>
        <Text style={s.meta}>
          {tr.date ?? "Sana"}: {data.date}{"   "}
          {tr.time ?? "Vaqt"}: {data.time}
        </Text>

        {locomotiveSection(tr.inUseTitle ?? tr.activeLocomotives ?? "Foydalanishda", data.activeLocomotives)}

        <View style={s.threeColGrid}>
          <View style={s.threeColItem}>{locomotiveSection(tr.switcherElectric ?? tr.switcherLocomotives ?? "Manevr", data.switcherLocomotives)}</View>
          <View style={s.threeColItem}>{locomotiveSection(tr.maintenanceTitle ?? tr.maintenanceLocomotives ?? "Xo'jalik", data.maintenanceLocomotives)}</View>
          <View style={s.threeColItem}>{locomotiveSection(tr.rentedTitle ?? tr.rentedLocomotives ?? "Arenda", data.rentedLocomotives)}</View>
        </View>

        <RepairSection
          title={tr.txk2Electric ?? "TXK-2"}
          groups={data.txk2Repair}
          tr={tr}
        />
        <RepairSection
          title={tr.electricRepair ?? "Elektrovoz ta'mir"}
          groups={data.electricRepair}
          tr={tr}
        />
        <RepairSection
          title={tr.dieselRepair ?? "Teplovoz ta'mir"}
          groups={data.dieselRepair}
          tr={tr}
        />
        <DelayedSection
          title={tr.delayedRepairs ?? "Kechikkan ta'mirlar"}
          groups={data.delayedLocomotives}
          tr={tr}
        />
        <ReservedSection
          title={tr.reservedLocomotives ?? tr.reserve ?? "Rezerv"}
          data={data.reservedLocomotives}
          tr={tr}
        />

        {/* Totals */}
        <View style={[s.sectionHeader, { marginTop: 10 }]}>
          <Text>{tr.summary ?? "Jami"}</Text>
        </View>
        <View style={s.table}>
          <View style={s.thead}>
            {[
              tr.active, tr.switcher, tr.maintenance,
              tr.rented, tr.electricRepair, tr.dieselRepair, tr.delayed, tr.total,
            ].map((h, i) => (
              <Text key={i} style={[s.th, { textAlign: "center" }]}>{h ?? "-"}</Text>
            ))}
          </View>
          <View style={s.row}>
            {[
              data.totals.active, data.totals.switcher, data.totals.maintenance,
              data.totals.rented, data.totals.electricRepair,
              data.totals.dieselRepair, data.totals.delayed, data.totals.total,
            ].map((v, i) => (
              <Text key={i} style={[s.td, { textAlign: "center" }]}>{String(v)}</Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateReportsPDF(data: PDFExportData) {
  const blob = await pdf(React.createElement(ReportDocument, { data }) as any).toBlob();
  saveAs(blob, `report_${data.date.replace(/\//g, "-")}.pdf`);
}
