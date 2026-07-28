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
    backgroundColor: "#eef2ff",
    padding: "4 6",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "center",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginTop: 8,
  },
  trainTypeHeader: {
    backgroundColor: "#dce3f0",
    padding: "3 6",
    fontSize: 8,
    fontWeight: "bold",
    marginTop: 6,
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
    backgroundColor: "#e0e7ff",
    padding: "3 5",
    fontSize: 7,
    textAlign: "center",
    fontWeight: "bold",
    color: "#3730a3",
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
  rowAlt: {
    backgroundColor: "#f8f9fc",
  },
});

export interface DelayedReportPDFData {
  title: string;
  date: string;
  time: string;
  org: string
  delayedLocomotives: Array<{
    name: string;
    inspection_types: Array<{
      name: string;
      locomotives: Array<{
        name: string;
        hour: number;
        mileage: number;
      }>;
    }>;
  }>;
  translations: Record<string, string>;
}

function DelayedDocument({ data }: { data: DelayedReportPDFData }) {
  const tr = data.translations;

  const trainTypeName = (name: string) => {
    if (name === "electric_freight_locos") return tr.freightLocos ?? "Elektrovoz-yuk";
    if (name === "electric_switches_locos") return tr.switcherLocos ?? "Elektrovoz-manyovr";
    if (name === "passenger_locos") return tr.passengerLocs ?? "Yo'lovchi";
    return tr.dieselLocs ?? "Teplovoz";
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>{data.title}</Text>
        <Text style={s.meta}>
          {tr.organization ?? "Tashkilot"}: {data.org}{"   "}
          {tr.date ?? "Sana"}: {data.date}{"   "}
          {tr.time ?? "Vaqt"}: {data.time}
        </Text>

        {data.delayedLocomotives.map((trainType, ti) => {
          const filtered = trainType.inspection_types.filter(
            (t) => t.locomotives.length > 0
          );
          if (!filtered.length) return null;
          return (
            <View key={ti}>
              <Text style={[s.sectionHeader, { marginTop: ti === 0 ? 0 : 8 }]}>
                {trainTypeName(trainType.name)}
              </Text>
              <View style={s.repairGrid}>
                {filtered.map((type, idx) => (
                  <View key={idx} style={s.repairBlock}>
                    <Text style={s.repairBlockHeader}>{type.name}</Text>
                    <View style={[s.repairRow, { backgroundColor: "#294169" }]}>
                      <Text style={[s.repairTd, { flex: 1, color: "white", fontSize: 7 }]}>
                        {tr.locomotive ?? "Lokomotiv"}
                      </Text>
                      <Text style={[s.repairTd, { flex: 1.5, color: "white", fontSize: 7 }]}>
                        {tr.hourKm ?? "Soat / Km"}
                      </Text>
                    </View>
                    {type.locomotives.map((loc, li) => (
                      <View key={li} style={[s.repairRow, li % 2 !== 0 ? s.rowAlt : {}]}>
                        <Text style={[s.repairTd, { flex: 1 }]}>{loc.name}</Text>
                        <Text style={[s.repairTd, { flex: 1.5 }]}>
                          {loc.hour ? loc.hour + " " + (tr.hour ?? "soat").toLowerCase() : loc.mileage + " " + (tr.km ?? "km").toLowerCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export async function generateDelayedReportPDF(data: DelayedReportPDFData) {
  const blob = await pdf(React.createElement(DelayedDocument, { data }) as any).toBlob();
  saveAs(blob, `delayed_report_${data.date.replace(/\//g, "-")}.pdf`);
}
