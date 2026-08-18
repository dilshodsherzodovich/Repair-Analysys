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
import { overrun } from "@/components/reports/unified/section-delayed-duration";
import type {
  ExportCell,
  UnifiedReportExportData,
} from "./unified-inspection-report-export-data";
import {
  exportFileName,
  formatDateTime,
  delayedDurationExportHeaders,
  delayedDurationExportRows,
  delayedEntryExportHeaders,
  delayedEntryExportRows,
  includesSection,
  inspectionsExportHeaders,
  inspectionsExportRows,
} from "./unified-inspection-report-export-data";

// Roboto ships with the app and covers Cyrillic, so the ru locale renders.
Font.register({ family: "Roboto", src: "/Roboto-Regular.ttf" });

const s = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 7.5, padding: 20, color: "#111" },
  title: { fontSize: 14, textAlign: "center", marginBottom: 3 },
  meta: { fontSize: 8, textAlign: "center", color: "#666", marginBottom: 12 },

  kpiRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  kpiBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderTopWidth: 3,
    borderRadius: 3,
    padding: 6,
  },
  kpiLabel: { fontSize: 6.5, color: "#64748b", marginBottom: 3 },
  kpiValue: { fontSize: 16 },
  kpiDelta: { fontSize: 6.5, color: "#64748b", marginTop: 2 },

  sectionTitle: {
    fontSize: 9,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: "#f1f5f9",
    padding: "4 6",
    borderRadius: 2,
  },
  note: { fontSize: 7, color: "#b45309", marginBottom: 4 },

  row: { flexDirection: "row" },
  th: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    fontSize: 6.5,
    padding: 3,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    textAlign: "center",
  },
  td: {
    fontSize: 7,
    padding: 3,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    textAlign: "center",
  },
  rowAlt: { backgroundColor: "#fafbfc" },
  empty: { fontSize: 8, color: "#94a3b8", textAlign: "center", padding: 8 },
});

const fmtNum = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString();

/** A table whose header repeats on every page a long section spills onto. */
function Table({
  headers,
  widths,
  rows,
}: {
  headers: string[];
  widths: number[];
  rows: ExportCell[][];
}) {
  if (rows.length === 0) return <Text style={s.empty}>—</Text>;
  return (
    <View>
      <View style={s.row} fixed>
        {headers.map((h, i) => (
          <Text key={i} style={[s.th, { flex: widths[i] }]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((cells, ri) => (
        <View key={ri} style={[s.row, ri % 2 === 1 ? s.rowAlt : {}]} wrap={false}>
          {cells.map((c, ci) => (
            <Text key={ci} style={[s.td, { flex: widths[ci] }]}>
              {c == null
                ? "—"
                : c instanceof Date
                ? formatDateTime(c)
                : typeof c === "number"
                ? c.toLocaleString()
                : c}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function UnifiedDocument({ data }: { data: UnifiedReportExportData }) {
  const { labels, kpis } = data;

  const entryRows = delayedEntryExportRows(data);

  const shown = (["inspections", "duration", "entry"] as const).filter((x) =>
    includesSection(data, x),
  );
  const sectionNo = (x: (typeof shown)[number]) => shown.indexOf(x) + 1;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>{data.title}</Text>
        <Text style={s.meta}>
          {[
            data.organization
              ? `${labels.organization}: ${data.organization}`
              : null,
            `${labels.period}: ${data.fromDate} — ${data.toDate}`,
            data.typeFilter
              ? `${labels.inspectionTypeFilter}: ${data.typeFilter}`
              : null,
            `${labels.generatedAt}: ${data.generatedAt}`,
          ]
            .filter(Boolean)
            .join("    •    ")}
        </Text>

        {/* ── KPI row ── */}
        <View style={s.kpiRow}>
          <View style={[s.kpiBox, { borderTopColor: "#cbd5e1" }]}>
            <Text style={s.kpiLabel}>{labels.kpiTotal}</Text>
            <Text style={s.kpiValue}>{fmtNum(kpis.total)}</Text>
          </View>
          <View style={[s.kpiBox, { borderTopColor: "#f87171" }]}>
            <Text style={s.kpiLabel}>{labels.kpiDelayedEntry}</Text>
            <Text style={s.kpiValue}>{fmtNum(kpis.delayedEntry)}</Text>
            <Text style={s.kpiDelta}>
              {kpis.delayedEntryLocomotives == null
                ? ""
                : `${kpis.delayedEntryLocomotives} ${labels.delayedLocomotivesCount}`}
            </Text>
          </View>
          <View style={[s.kpiBox, { borderTopColor: "#fbbf24" }]}>
            <Text style={s.kpiLabel}>{labels.kpiDelayedDuration}</Text>
            <Text style={s.kpiValue}>{fmtNum(kpis.delayedDuration)}</Text>
          </View>
        </View>

        {/* ── Breakdown by type ── */}
        <Text style={s.sectionTitle}>{labels.byType}</Text>
        <Table
          headers={[
            labels.inspectionType,
            labels.total,
            labels.kpiDelayedEntry,
            labels.kpiDelayedDuration,
          ]}
          widths={[3, 1, 1.4, 1.4]}
          rows={data.breakdown.map((b) => [
            b.name,
            b.total,
            b.delayedEntry,
            b.delayedDuration,
          ])}
        />

        {includesSection(data, "inspections") && (
          <View>
            <Text style={s.sectionTitle}>
              {sectionNo("inspections")}. {labels.sectionInspections} (
              {data.inspections.length})
            </Text>
            <Table
              headers={inspectionsExportHeaders(data)}
              widths={[0.5, 2, 2, 1.5, 1.5, 1.5]}
              rows={inspectionsExportRows(data)}
            />
          </View>
        )}

        {includesSection(data, "duration") && (
          <View>
            <Text style={s.sectionTitle}>
              {sectionNo("duration")}. {labels.sectionDelayedDuration} (
              {data.delayedDuration.length})
            </Text>
            <Table
              headers={delayedDurationExportHeaders(data)}
              widths={[0.4, 1.6, 1.4, 1.1, 1.1, 1.1, 0.9, 0.9, 0.9, 2.6]}
              rows={delayedDurationExportRows(data)}
            />
          </View>
        )}

        {includesSection(data, "entry") && (
          <View>
            <Text style={s.sectionTitle}>
              {sectionNo("entry")}. {labels.sectionDelayedEntry} (
              {entryRows.length})
            </Text>
            <Table
              headers={delayedEntryExportHeaders(data)}
              widths={[0.4, 1.8, 1, 1.5, 1.3, 0.8, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7]}
              rows={entryRows}
            />
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function generateUnifiedReportPDF(data: UnifiedReportExportData) {
  const blob = await pdf(
    React.createElement(UnifiedDocument, { data }) as any,
  ).toBlob();
  saveAs(blob, exportFileName(data, "pdf"));
}
