/** @jsxRuntime classic */
/** @jsx React.createElement */
"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { Inspection } from "@/api/types/report-inspection";
import { format } from "date-fns";
import { uz, ru } from "date-fns/locale";
import uzMessages from "@/messages/uz.json";
import ruMessages from "@/messages/ru.json";

Font.register({ family: "Roboto", src: "/Roboto-Regular.ttf" });

export interface LocomotiveInspectionsPDFData {
  inspections: Inspection[];
  locomotiveName: string;
  startDate: Date;
  endDate: Date;
  locale: string;
}

const s = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 8, padding: 16, color: "#111" },
  title: { fontSize: 13, textAlign: "center", marginBottom: 3 },
  meta: { fontSize: 8, textAlign: "center", color: "#666", marginBottom: 6 },
  divider: { borderBottom: "0.5 solid #ccc", marginBottom: 8 },
  thead: { flexDirection: "row", backgroundColor: "#294169" },
  th: { color: "white", padding: "4 5", fontSize: 8, borderRight: "0.5 solid #3d5a8a" },
  dateRow: { flexDirection: "row", backgroundColor: "#e4e9f8", padding: "4 6", border: "0.5 solid #c5cde8" },
  dateText: { fontSize: 8, color: "#19326e" },
  row: { flexDirection: "row", borderBottom: "0.5 solid #d0d0d8", borderLeft: "0.5 solid #d0d0d8", borderRight: "0.5 solid #d0d0d8" },
  rowAlt: { backgroundColor: "#f8f9fc" },
  td: { padding: "3 5", fontSize: 8, borderRight: "0.5 solid #d0d0d8" },
});

const cols = [
  { flex: 0.7, center: true },
  { flex: 2.2 },
  { flex: 1, center: true },
  { flex: 1.8 },
  { flex: 1.8 },
  { flex: 2 },
];

function InspectionsDocument({ data }: { data: LocomotiveInspectionsPDFData }) {
  const isRu = data.locale === "ru";
  const msgs = isRu ? ruMessages : uzMessages;
  const t = msgs.Inspects;
  const dateLocale = isRu ? ru : uz;

  const title = msgs.LocomotiveHistory.timelineTitle;
  const fmtDisplay = (date: Date) => format(date, "dd MMM yyyy", { locale: dateLocale });
  const dateRange = `${fmtDisplay(data.startDate)} - ${fmtDisplay(data.endDate)}`;

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

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.meta}>{data.locomotiveName}   |   {dateRange}</Text>
        <View style={s.divider} />

        <View style={s.thead}>
          {headers.map((h, i) => (
            <Text key={i} style={[s.th, { flex: cols[i].flex, textAlign: cols[i].center ? "center" : "left" }]}>
              {h}
            </Text>
          ))}
        </View>

        {sortedDates.map((dateStr) => {
          const rows = inspectionsByDate[dateStr]
            .slice()
            .sort((a, b) => new Date(a.created_time).getTime() - new Date(b.created_time).getTime());

          return (
            <View key={dateStr}>
              <View style={s.dateRow}>
                <Text style={s.dateText}>{dateStr}</Text>
              </View>
              {rows.map((ins, idx) => {
                const status = ins.is_cancelled
                  ? t.canceled
                  : ins.is_closed
                  ? t.closed
                  : t.open;
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
                return (
                  <View key={ins.id} style={s.row}>
                    {cells.map((cell, ci) => (
                      <Text key={ci} style={[s.td, { flex: cols[ci].flex }, cols[ci].center ? { textAlign: "center" } : {}]}>
                        {cell}
                      </Text>
                    ))}
                  </View>
                );
              })}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export async function generateLocomotiveInspectionsPdf(data: LocomotiveInspectionsPDFData) {
  const fmtFile = (date: Date) => format(date, "dd-MM-yyyy");
  const blob = await pdf(React.createElement(InspectionsDocument, { data }) as any).toBlob();
  saveAs(
    blob,
    `locomotive-inspections_${data.locomotiveName.replace(/\s+/g, "_")}_${fmtFile(data.startDate)}_${fmtFile(data.endDate)}.pdf`
  );
}
