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
import { Inspection } from "@/api/types/report-inspection";
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
    backgroundColor: "#1e3a5f",
    color: "white",
    padding: "4 8",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 0,
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 10,
  },
  summaryCell: {
    flex: 1,
    alignItems: "center",
    padding: "6 4",
    backgroundColor: "#f0f4ff",
    border: "1 solid #c7d7fe",
    marginRight: 4,
    borderRadius: 3,
  },
  summaryCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1d4ed8",
  },
  summaryName: {
    fontSize: 6,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 2,
  },
  typeHeader: {
    backgroundColor: "#1e3a5f",
    flexDirection: "row",
    marginTop: 6,
  },
  th: {
    color: "white",
    padding: "3 4",
    fontSize: 7,
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5 solid #e5e7eb",
  },
  rowAlt: {
    backgroundColor: "#f8f9fc",
  },
  td: {
    padding: "2.5 4",
    fontSize: 7,
  },
  typeLabel: {
    backgroundColor: "#eff6ff",
    padding: "2 6",
    fontSize: 7,
    fontWeight: "bold",
    color: "#1d4ed8",
    marginTop: 8,
    borderLeft: "3 solid #3b82f6",
  },
});

export interface InspectionsPDFData {
  inspectionsByType: Record<string, { count: number; inspections: Inspection[] }>;
  startDate: Date;
  endDate: Date;
  title: string;
  translations: {
    inspectionReport?: string;
    inspectionCountsByType?: string;
    inspectionsList?: string;
    no?: string;
    locomotive?: string;
    branch?: string;
    createdTime?: string;
    closeTime?: string;
  };
}

function InspectionsDocument({ data }: { data: InspectionsPDFData }) {
  const tr = data.translations;
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}.${m}.${y}`;
  };
  const sorted = Object.entries(data.inspectionsByType).sort(
    (a, b) => b[1].count - a[1].count
  );

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>{data.title}</Text>
        <Text style={s.meta}>
          {fmt(data.startDate)} — {fmt(data.endDate)}
        </Text>

        {/* Summary row */}
        <Text style={s.sectionHeader}>{tr.inspectionCountsByType ?? "Counts by Type"}</Text>
        <View style={s.summaryRow}>
          {sorted.map(([typeName, d], i) => (
            <View
              key={typeName}
              // Spread rather than `&&`: this renderer's Style type rejects a
              // `false` entry inside the array.
              style={[
                s.summaryCell,
                ...(i === sorted.length - 1 ? [{ marginRight: 0 }] : []),
              ]}
            >
              <Text style={s.summaryCount}>{d.count}</Text>
              <Text style={s.summaryName}>{typeName}</Text>
            </View>
          ))}
        </View>

        {/* Detail tables */}
        <Text style={[s.sectionHeader, { marginTop: 0 }]}>{tr.inspectionsList ?? "Inspections List"}</Text>
        {sorted.map(([typeName, d]) => (
          <View key={typeName}>
            <Text style={s.typeLabel}>{typeName} ({d.count})</Text>
            <View style={s.typeHeader}>
              <Text style={[s.th, { width: 24 }]}>{tr.no ?? "№"}</Text>
              <Text style={[s.th, { flex: 2 }]}>{tr.locomotive ?? "Lokomotiv"}</Text>
              <Text style={[s.th, { flex: 2 }]}>{tr.branch ?? "Filial"}</Text>
              <Text style={[s.th, { flex: 2 }]}>{tr.createdTime ?? "Kirdi"}</Text>
              <Text style={[s.th, { flex: 2 }]}>{tr.closeTime ?? "Chiqdi"}</Text>
            </View>
            {d.inspections.map((ins, li) => (
              <View key={ins.id} style={[s.row, li % 2 !== 0 ? s.rowAlt : {}]}>
                <Text style={[s.td, { width: 24, textAlign: "center" }]}>{li + 1}</Text>
                <Text style={[s.td, { flex: 2 }]}>
                  {[ins.locomotive?.name, ins.locomotive?.locomotive_model?.name]
                    .filter(Boolean).join(" ") || "-"}
                </Text>
                <Text style={[s.td, { flex: 2 }]}>{ins.branch?.name ?? "-"}</Text>
                <Text style={[s.td, { flex: 2 }]}>
                  {ins.created_time ? formatDate(ins.created_time) : "-"}
                </Text>
                <Text style={[s.td, { flex: 2 }]}>
                  {ins.is_closed_time ? formatDate(ins.is_closed_time) : "-"}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function generateInspectionsPDF(data: InspectionsPDFData) {
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  const blob = await pdf(
    React.createElement(InspectionsDocument, { data }) as any
  ).toBlob();
  saveAs(blob, `inspection-report_${fmt(data.startDate)}_${fmt(data.endDate)}.pdf`);
}
