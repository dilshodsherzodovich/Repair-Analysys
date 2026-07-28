"use client";

import { useTranslations, useLocale } from "next-intl";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect, useMemo, useState } from "react";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import DelayedReportFilters, {
  getTashkentDateString,
} from "@/components/reports/delayed-report-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { useDelayedLocomotives } from "@/api/hooks/use-reports";
import type { DelayedLocomotivesResponse, DelayedLocomotive } from "@/api/types/reports";
import PageLoading from "@/components/page-loading";
import { defineGridColsCount } from "@/lib/utils";
import { FileDown, Loader2 } from "lucide-react";
import { generateDelayedReportPDF } from "@/utils/delayed-report-pdf-export";
import type { DelayedReportPDFData } from "@/utils/delayed-report-pdf-export";
import { generateDelayedReportExcel } from "@/utils/delayed-report-excel-export";
import { useOrganization } from "@/api/hooks/use-organizations";
import { format } from "date-fns";
import {
  ReportOrganizationSelect,
  useReportOrganization,
} from "@/components/reports/report-organization-select";

const SUPERVISOR_ROLES = ["admin", "dispatcher", "operator", "rb_admin"];

export default function DelayedReportPage() {
  const t = useTranslations("Reports");
  const globalT = useTranslations();
  const locale = useLocale();
  const user = useCurrentUser();
  const role = user?.role;

  if (role !== "admin" && role !== "tchzr") return null;

  const { filters, setFilters } = useReportFilters();

  const today = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const [fromDate, setFromDate] = useState<string>(getTashkentDateString(yesterday));
  const [toDate, setToDate] = useState<string>(getTashkentDateString(today));
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const isSupervisor = SUPERVISOR_ROLES.includes(role);
  const { data: organizations } = useOrganization();

  const { organizationId } = useReportOrganization();

  // With "all organizations" selected there is no single name to print on the
  // export, so it falls back to the user's own organization.
  const orgName =
    (isSupervisor
      ? organizations?.find(
          (o: { id: number; name: string }) => o.id === organizationId,
        )?.name
      : user?.branch?.organization?.name) ?? "";

  const { data, isPending, isFetching, refetch } = useDelayedLocomotives({
    organization: organizationId,
    fromDate,
    toDate,
  });

  const rows = (data as DelayedLocomotivesResponse[] | undefined) ?? [];


  const trainTypeName = (name: string) =>
    name === "electric_freight_locos"
      ? t("freightElectric")
      : name === "electric_switches_locos"
      ? t("switcherLocos")
      : name === "passenger_locos"
      ? t("passenger_locs")
      : t("diesel_locs");

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdfData: DelayedReportPDFData = {
        title: t("delayedReportTitle"),
        date: format(new Date(), "dd.MM.yyyy"),
        time: format(new Date(), "HH:mm"),
        org: orgName,
        delayedLocomotives: rows,
        translations: {
          date: t("date"),
          time: t("time"),
          locomotive: t("locomotive"),
          hourKm: t("hourKm"),
          hour: globalT("hour"),
          km: globalT("Km"),
          freightLocos: t("freightElectric"),
          switcherLocos: t("switcherLocos"),
          passengerLocs: t("passenger_locs"),
          dieselLocs: t("diesel_locs"),
          organization: globalT("UserDialog.organization")
        },
      };
      await generateDelayedReportPDF(pdfData);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await generateDelayedReportExcel({
        title: t("delayedReportTitle"),
        date: format(new Date(), "dd.MM.yyyy"),
        time: format(new Date(), "HH:mm"),
        org: orgName,
        delayedLocomotives: rows,
        translations: {
          date: t("date"),
          time: t("time"),
          locomotive: t("locomotive"),
          hourKm: t("hourKm"),
          hour: globalT("hour"),
          km: globalT("Km"),
          freightLocos: t("freightElectric"),
          switcherLocos: t("switcherLocos"),
          passengerLocs: t("passenger_locs"),
          dieselLocs: t("diesel_locs"),
          organization: globalT("UserDialog.organization"),
        },
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (isPending) return <PageLoading />;

  return (
    <div className="space-y-4">
      {/* ─── Header Card ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-gray-900 font-semibold text-base leading-tight">
                {t("delayedReportTitle")}
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                {new Date().toLocaleDateString(
                  locale === "ru" ? "ru-RU" : "uz-UZ",
                  { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
            >
              {isExportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isExportingExcel ? t("generatingExcel") : t("exportExcel")}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isExporting ? t("generatingPDF") : t("exportPDF")}
            </button>
          </div>
        </div>
        <div className="px-5 py-3 bg-gray-50/60">
          <DelayedReportFilters
            fromDate={fromDate}
            toDate={toDate}
            onChange={({ fromDate, toDate }) => {
              if (fromDate !== undefined) setFromDate(fromDate);
              if (toDate !== undefined) setToDate(toDate);
            }}
            onRefresh={() => refetch()}
            leading={
              <ReportOrganizationSelect
                label
                labelClassName="text-sm font-normal normal-case tracking-normal text-foreground pl-0"
                className="gap-2"
              />
            }
          />
        </div>
      </div>

      <div className="space-y-4 border p-5 rounded-xl shadow-md">
        {/* ─── Stat card ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {rows.map((trainType) => {
            const count = trainType.inspection_types.reduce(
              (s, it) => s + it.locomotives.length,
              0
            );
            return (
              <div
                key={trainType.name}
                className="bg-indigo-50 border border-t-4 border-t-indigo-400 rounded-xl px-3 py-3 text-center"
              >
                <p className="text-2xl font-bold text-indigo-600">{count}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mt-0.5 leading-tight">
                  {trainTypeName(trainType.name)}
                </p>
              </div>
            );
          })}
        </div>

        {/* ─── Sections per train type ─── */}
        {!rows.length ? (
          <EmptyState label={t("noData")} />
        ) : (
          rows.map((trainType, idx) => {
            const filtered = trainType.inspection_types.filter(
              (type) => type.locomotives.length > 0
            );
            if (!filtered.length) return null;
            const count = filtered.reduce((s, it) => s + it.locomotives.length, 0);
            return (
              <SectionCard
                key={`delayed-${idx}`}
                title={trainTypeName(trainType.name)}
                count={count}
              >
                <div className="divide-y divide-gray-100">
                  <div
                    className={`grid divide-x-2 divide-indigo-100 [&>*:nth-child(6n+1)]:border-l-0 ${defineGridColsCount(filtered.length, 6)}`}
                  >
                    {filtered.map((type) => (
                      <div key={type.name} className="overflow-hidden">
                        <div className="bg-indigo-50 px-3 py-1.5 border-b border-indigo-100">
                          <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide text-center">
                            {type.name}
                          </p>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 border-b border-gray-200">
                              <TableHead className="h-8 text-[12px] text-gray-400 font-semibold border-r border-gray-200">
                                {t("locomotive")}
                              </TableHead>
                              <TableHead className="h-8 text-[12px] text-gray-400 font-semibold">
                                {t("hourKm")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {type.locomotives.map((loc: DelayedLocomotive) => (
                              <TableRow
                                key={loc.name}
                                className="border-b border-gray-200 hover:bg-gray-50/60"
                              >
                                <TableCell className="font-semibold text-gray-800 text-sm border-r border-gray-200 py-1.5">
                                  {loc.name}
                                </TableCell>
                                <TableCell className="text-gray-600 text-sm py-1.5">
                                  {loc.hour
                                    ? `${loc.hour} ${globalT("hour").toLowerCase()}`
                                    : ""}
                                  {loc.hour && loc.mileage ? " / " : ""}
                                  {loc.mileage
                                    ? `${loc.mileage} ${globalT("Km").toLowerCase()}`
                                    : ""}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const suffix = locale === "ru" ? " шт." : " ta";
  return (
    <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-indigo-400 border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
          {count}{suffix}
        </span>
      </div>
      <div className="py-2">{children}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-16">
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
