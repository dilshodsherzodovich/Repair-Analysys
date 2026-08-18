"use client";

import {
  useReports,
  useInspectionTypeLocomotives,
  useDelayedLocomotives,
  useTxk2InspectionTypeLocomotives,
  useReservedLocomotives,
} from "@/api/hooks/use-reports";
import type {
  InspectionTypeGroup,
  InspectionTypeLocomotive,
  InspectionTypeLocomotivesResponse,
  DelayedLocomotivesResponse,
  DelayedInspectionType,
  DelayedLocomotive,
} from "@/api/types/reports";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { useTranslations, useLocale } from "next-intl";
import PageLoading from "../page-loading";
import ReportsDateFilter from "./reports-date-filter";
import {
  ReportOrganizationSelect,
  useReportOrganization,
} from "./report-organization-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { formatDate } from "@/utils/formatDate";
import { defineGridColsCount } from "@/lib/utils";
import { PDFExportButton } from "./pdf-export-button";
import type { PDFExportData } from "@/utils/pdf-export";

export default function ReportDashboard() {
  const t = useTranslations("Reports");
  const globalT = useTranslations();
  const locale = useLocale();
  const countSuffix = locale === "ru" ? " шт." : " ta";

  const { filters } = useReportFilters();
  const { organizationId } = useReportOrganization();

  const { data: apiData, isLoading, isError } = useReports({
    organization: organizationId,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  const { data: inspectionData, isLoading: isInspectionLoading, isError: isInspectionError } =
    useInspectionTypeLocomotives({
      organization: organizationId,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });

  const { data: delayedData, isLoading: isDelayedLoading, isError: isDelayedError } =
    // Snapshot endpoint — no date window applies.
    useDelayedLocomotives({
      organization: organizationId,
    });

  const { data: txk2InspectionData, isLoading: isTxk2InspectionLoading, isError: isTxk2InspectionError } =
    useTxk2InspectionTypeLocomotives({
      organization: organizationId,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });

  const { data: reservedData, isLoading: isReservedLoading, isError: isReservedError } =
    useReservedLocomotives({
      organization: organizationId,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });

  const convertToDisplayData = (data: Record<string, string[]> | undefined) => {
    if (!data) return [];
    return Object.entries(data).map(([station, locomotives]) => ({
      name: station,
      codes: locomotives.join("; "),
      total: `${locomotives.length}${countSuffix}`,
      count: locomotives.length,
    }));
  };

  if (
    isLoading || isInspectionLoading || isDelayedLoading ||
    isTxk2InspectionLoading || isReservedLoading
  ) return <PageLoading />;

  if (
    isError || isInspectionError || isDelayedError ||
    isTxk2InspectionError || isReservedError
  ) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500 text-lg">{t("error")}</div>
      </div>
    );
  }

  const activeLocomotives = convertToDisplayData(apiData?.active_locomotives);
  const switcherLocomotives = convertToDisplayData(apiData?.switcher_electric_locomotives);
  const maintenanceLocomotives = convertToDisplayData(apiData?.maintenance_locomotives);
  const rentedLocomotives = convertToDisplayData(apiData?.rented_locomotives);

  const totalActive = Object.values(apiData?.active_locomotives || {}).flat().length;
  const totalSwitcher = Object.values(apiData?.switcher_electric_locomotives || {}).flat().length;
  const totalMaintenance = Object.values(apiData?.maintenance_locomotives || {}).flat().length;
  const totalRented = Object.values(apiData?.rented_locomotives || {}).flat().length;

  const totalElectricRepair = inspectionData?.electric_loco?.reduce(
    (sum: number, type: InspectionTypeGroup) => sum + type?.locomotives?.length, 0
  ) || 0;
  const totalDieselRepair = inspectionData?.diesel_loco?.reduce(
    (sum: number, type: InspectionTypeGroup) => sum + type?.locomotives?.length, 0
  ) || 0;
  const totalTxk2 = txk2InspectionData?.electric_loco?.reduce(
    (sum: number, type: InspectionTypeGroup) => sum + type?.locomotives?.length, 0
  ) || 0;
  const totalDelayed = delayedData?.reduce(
    (sum: number, type: DelayedLocomotivesResponse) =>
      sum + type?.inspection_types?.reduce(
        (s: number, it: DelayedInspectionType) => s + it?.locomotives?.length, 0
      ), 0
  ) || 0;
  const totalReserved = Object.values(reservedData || {}).flat().length;

  // Prepare data for PDF export
  const preparePDFData = (): PDFExportData => {
    const currentDate = new Date();
    const date = currentDate.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US");
    const time = currentDate.toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const electricRepair = inspectionData?.electric_loco?.map((type: InspectionTypeGroup) => ({
      name: type.name,
      locomotives: type.locomotives?.map((loco: InspectionTypeLocomotive) => ({
        name: loco.name,
        inspection_started_time: loco.inspection_started_time,
        inspection_closed_time: loco.inspection_closed_time,
      })) || [],
    })) || [];

    const dieselRepair = inspectionData?.diesel_loco?.map((type: InspectionTypeGroup) => ({
      name: type.name,
      locomotives: type.locomotives?.map((loco: InspectionTypeLocomotive) => ({
        name: loco.name,
        inspection_started_time: loco.inspection_started_time,
        inspection_closed_time: loco.inspection_closed_time,
      })) || [],
    })) || [];

    const txk2Repair = txk2InspectionData?.electric_loco?.map((type: InspectionTypeGroup) => ({
      name: type.name,
      locomotives: type.locomotives?.map((loco: InspectionTypeLocomotive) => ({
        name: loco.name,
        inspection_started_time: loco.inspection_started_time,
        inspection_closed_time: loco.inspection_closed_time,
      })) || [],
    })) || [];

    return {
      title: t("title"),
      date,
      time,
      totalLocomotives: totalActive + totalSwitcher + totalMaintenance + totalRented + totalElectricRepair + totalDieselRepair + totalDelayed,
      activeLocomotives,
      switcherLocomotives,
      maintenanceLocomotives,
      rentedLocomotives,
      electricRepair,
      dieselRepair,
      txk2Repair,
      delayedLocomotives: delayedData || [],
      reservedLocomotives: reservedData || {},
      totals: {
        active: totalActive,
        switcher: totalSwitcher,
        maintenance: totalMaintenance,
        rented: totalRented,
        electricRepair: totalElectricRepair,
        dieselRepair: totalDieselRepair,
        delayed: totalDelayed,
        total: totalActive + totalSwitcher + totalMaintenance + totalRented + totalElectricRepair + totalDieselRepair + totalDelayed,
      },
      locale,
      translations: {
        date: t("date"),
        time: t("time"),
        total: t("total"),
        summary: t("summary"),
        active: t("active"),
        switcher: t("switcher"),
        maintenance: t("maintenance"),
        rented: t("rented"),
        repair: t("repair"),
        electricRepair: t("electricRepair"),
        dieselRepair: t("dieselRepair"),
        started: t("started"),
        noData: t("noData"),
        activeLocomotives: t("activeLocomotives"),
        switcherLocomotives: t("switcherLocomotives"),
        maintenanceLocomotives: t("maintenanceLocomotives"),
        rentedLocomotives: t("rentedLocomotives"),
        delayed: t("delayed"),
        txk2Electric: t("txk2Electric"),
        reserve: t("reserve"),
        delayedRepairs: t("delayedRepairs"),
        closed: t("closed"),
        hour: globalT("hour"),
        km: globalT("Km"),
        reserveStarted: t("started"),
        reserveClosed: t("closed"),
        locomotive: t("locomotive"),
        locomotives: t("locomotives"),
        entered: t("entered"),
        exited: t("exited"),
        station: t("station"),
        hourKm: t("hourKm"),
        reservedLocomotives: t("reservedLocomotives"),
        freightLocos: t("freightLocos"),
        switcherLocos: t("switcherLocos"),
        passengerLocs: t("passenger_locs"),
        dieselLocs: t("diesel_locs"),
        inUseTitle: t("inUseTitle"),
        switcherElectric: t("switcherElectric"),
        maintenanceTitle: t("maintenanceLocomotives"),
        rentedTitle: t("rentedLocomotives"),
      },
    };
  };

  const trainTypeName = (name: string) =>
    name === "electric_freight_locos" ? t("freightLocos")
    : name === "electric_switches_locos" ? t("switcherLocos")
    : name === "passenger_locos" ? t("passenger_locs")
    : t("diesel_locs");

  return (
    <div className="min-h-screen">
      <div className="space-y-4">

      {/* ─── Header Card ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" data-no-pdf>
        {/* Top row: title + export */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h6l2-1z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 6h3l3 4v4h-2" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-gray-900 font-semibold text-base leading-tight">{t("title")}</h1>
              <p className="text-gray-400 text-xs mt-0.5">
                {new Date().toLocaleDateString(
                  locale === "ru" ? "ru-RU" : "uz-UZ",
                  { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                )}
              </p>
            </div>
          </div>
          <PDFExportButton data={preparePDFData()} className="shrink-0" />
        </div>
        {/* Bottom row: date filter */}
        <div className="px-5 py-3 bg-gray-50/60">
          <ReportsDateFilter
            leading={<ReportOrganizationSelect label={t("organization")} />}
          />
        </div>
      </div>

      <div className="space-y-4 border p-5 rounded-xl shadow-md">
        {/* ─── Fleet Snapshot ─── */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {[
            { label: t("inUseShort"),      count: totalActive,         border: "border-t-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
            { label: t("switcherShort"),   count: totalSwitcher,       border: "border-t-sky-500",     text: "text-sky-600",     bg: "bg-sky-50"     },
            { label: t("maintenanceShort"),count: totalMaintenance,    border: "border-t-sky-500",     text: "text-sky-600",     bg: "bg-sky-50"     },
            { label: t("rentedShort"),     count: totalRented,         border: "border-t-sky-500",     text: "text-sky-600",     bg: "bg-sky-50"     },
            { label: "TXK-2",             count: totalTxk2,           border: "border-t-amber-500",   text: "text-amber-600",   bg: "bg-amber-50"   },
            { label: t("electricShort"),   count: totalElectricRepair, border: "border-t-amber-500",   text: "text-amber-600",   bg: "bg-amber-50"   },
            { label: t("dieselShort"),     count: totalDieselRepair,   border: "border-t-amber-500",   text: "text-amber-600",   bg: "bg-amber-50"   },
            { label: t("delayedShort"),    count: totalDelayed,        border: "border-t-rose-500",    text: "text-rose-600",    bg: "bg-rose-50"    },
            { label: t("reserveShort"),    count: totalReserved,       border: "border-t-violet-500",  text: "text-violet-600",  bg: "bg-violet-50"  },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} border border-t-4 ${s.border} rounded-xl px-3 py-3 text-center`}
            >
              <p className={`text-2xl font-bold ${s.text}`}>{s.count}</p>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ─── Foydalanishda ─── */}
        <SectionCard
          title={t("inUseTitle")}
          count={totalActive}
          accent="emerald"
        >
          {activeLocomotives.length === 0 ? <EmptyState /> : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="h-8 text-xs text-gray-500 font-semibold tracking-wide w-40 border-r border-gray-200">{t("station")}</TableHead>
                  <TableHead className="h-8 text-xs text-gray-500 font-semibold tracking-wide border-r border-gray-200">{t("locomotives")}</TableHead>
                  <TableHead className="h-8 text-xs text-gray-500 font-semibold tracking-wide text-right w-20">{t("total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLocomotives.map((station, i) => (
                  <TableRow key={station.name} data-pdf-block className="border-b border-gray-200 hover:bg-gray-50/60">
                    <TableCell className="font-semibold text-gray-800 text-sm border-r border-gray-200 py-2">{station.name}</TableCell>
                    <TableCell className="text-gray-600 text-sm border-r border-gray-200 py-2">{station.codes}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 text-sm py-2">{station.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        {/* ─── Manevr / Xo'jalik / Arenda ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: t("switcherElectric"),      count: totalSwitcher,    items: switcherLocomotives },
            { title: t("maintenanceLocomotives"), count: totalMaintenance, items: maintenanceLocomotives },
            { title: t("rentedLocomotives"),      count: totalRented,      items: rentedLocomotives },
          ].map((col) => (
            <SectionCard key={col.title} title={col.title} count={col.count} accent="sky">
              {col.items.length === 0 ? <EmptyState /> : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="h-8 text-xs text-gray-500 font-semibold tracking-wide border-r border-gray-200">{t("station")}</TableHead>
                      <TableHead className="h-8 text-xs text-gray-500 font-semibold tracking-wide">{t("locomotives")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {col.items.map((station) => (
                      <TableRow key={station.name} data-pdf-block className="border-b border-gray-200 hover:bg-gray-50/60">
                        <TableCell className="font-semibold text-gray-800 text-sm border-r border-gray-200 py-2">{station.name}</TableCell>
                        <TableCell className="text-gray-600 text-sm py-2">{station.codes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>
          ))}
        </div>

        {/* ─── TXK-2 Ta'mir ─── */}
        <SectionCard title={t("txk2Electric")} count={totalTxk2} accent="amber">
          {!txk2InspectionData?.electric_loco?.length ? <EmptyState /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-x divide-gray-100">
              {txk2InspectionData.electric_loco.map((repairType: InspectionTypeGroup, idx: number) => (
                <RepairTypeTable key={`txk2-${idx}`} repairType={repairType} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* ─── Elektrovoz Ta'mir ─── */}
        <SectionCard title={t("electricRepair")} count={totalElectricRepair} accent="amber">
          {!inspectionData?.electric_loco?.length ? <EmptyState /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-x divide-gray-100">
              {inspectionData.electric_loco.map((repairType: InspectionTypeGroup, idx: number) => (
                <RepairTypeTable key={`electric-${idx}`} repairType={repairType} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* ─── Teplovoz Ta'mir ─── */}
        <SectionCard title={t("dieselRepair")} count={totalDieselRepair} accent="amber">
          {!inspectionData?.diesel_loco?.length ? <EmptyState /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-x divide-gray-100">
              {inspectionData.diesel_loco.map((repairType: InspectionTypeGroup, idx: number) => (
                <RepairTypeTable key={`diesel-${idx}`} repairType={repairType} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* ─── Kechikkan Ta'mirlar ─── */}
        <SectionCard title={t("delayedRepairs")} count={totalDelayed} accent="rose" data-pdf-separate-page>
          {!delayedData?.length ? <EmptyState /> : (
            <div className="divide-y divide-gray-100">
              {delayedData.map((trainType: DelayedLocomotivesResponse, idx: number) => {
                const filtered = trainType.inspection_types.filter((t) => t.locomotives.length > 0);
                if (!filtered.length) return null;
                return (
                  <div key={`delayed-${idx}`} className="py-3">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-widest px-4 mb-2">
                      {trainTypeName(trainType.name)}
                    </p>
                    <div className={`grid divide-x divide-gray-100 [&>*:nth-child(6n+1)]:border-l-0 ${defineGridColsCount(filtered.length, 6)}`}>
                      {filtered.map((type) => (
                        <div key={type.name} className="overflow-hidden">
                          <div className="bg-rose-50 px-3 py-1.5 border-b border-rose-100">
                            <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide text-center">{type.name}</p>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50 border-b border-gray-200">
                                <TableHead className="h-8 text-[12px] text-gray-400 font-semibold border-r border-gray-200">{t("locomotive")}</TableHead>
                                <TableHead className="h-8 text-[12px] text-gray-400 font-semibold">{t("hourKm")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {type.locomotives.map((loc: DelayedLocomotive, li: number) => (
                                <TableRow key={loc.name} data-pdf-block className="border-b border-gray-200 hover:bg-gray-50/60">
                                  <TableCell className="font-semibold text-gray-800 text-sm border-r border-gray-200 py-1.5">{loc.name}</TableCell>
                                  <TableCell className="text-gray-600 text-sm py-1.5">
                                    {loc.hour ? loc.hour + " " + globalT("hour").toLowerCase() : loc.mileage + " " + globalT("Km").toLowerCase()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ─── Rezervdagi Lokomotivlar ─── */}
        <SectionCard title={t("reservedLocomotives")} count={totalReserved} accent="violet" data-pdf-separate-page>
          {Object.keys(reservedData || {}).length === 0 ? <EmptyState /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-x divide-gray-100">
              {Object.entries(reservedData || {}).map(([groupName, group]) => (
                <div key={`reserved-${groupName}`} className="overflow-hidden">
                  <div className="bg-violet-50 px-3 py-1.5 border-b border-violet-100">
                    <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wide text-center">{groupName}</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b border-gray-200">
                        <TableHead className="h-8 text-[12px] text-gray-400 font-semibold border-r border-gray-200">{t("locomotive")}</TableHead>
                        <TableHead className="h-8 text-[12px] text-gray-400 font-semibold border-r border-gray-200">{t("entered")}</TableHead>
                        <TableHead className="h-8 text-[12px] text-gray-400 font-semibold">{t("exited")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.map((loco) => (
                        <TableRow key={`reserved-${loco.loco_id}`} data-pdf-block className="border-b border-gray-200 hover:bg-gray-50/60">
                          <TableCell className="font-semibold text-gray-800 text-sm border-r border-gray-200 py-1.5">{loco.loco_name}</TableCell>
                          <TableCell className="text-gray-600 text-sm border-r border-gray-200 py-1.5">
                            {loco.reserve_started_time ? formatDate(loco.reserve_started_time) : "—"}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm py-1.5">
                            {loco.reserve_closed_time ? formatDate(loco.reserve_closed_time) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const accentMap = {
  emerald: { border: "border-l-emerald-500", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  sky:     { border: "border-l-sky-500",     badge: "bg-sky-100 text-sky-700",         dot: "bg-sky-500"     },
  amber:   { border: "border-l-amber-500",   badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  rose:    { border: "border-l-rose-500",    badge: "bg-rose-100 text-rose-700",       dot: "bg-rose-500"    },
  violet:  { border: "border-l-violet-500",  badge: "bg-violet-100 text-violet-700",   dot: "bg-violet-500"  },
};

function SectionCard({
  title,
  count,
  accent,
  children,
  ...rest
}: {
  title: string;
  count: number;
  accent: keyof typeof accentMap;
  children: React.ReactNode;
  [key: string]: any;
}) {
  const locale = useLocale();
  const suffix = locale === "ru" ? " шт." : " ta";
  const a = accentMap[accent];
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-l-4 ${a.border} border border-gray-200 overflow-hidden`}
      {...rest}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${a.dot}`} />
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${a.badge}`}>
          {count}{suffix}
        </span>
      </div>
      {/* Vertical breathing room so the table does not sit flush against the
          card's header and bottom border. Kept to `py` only, so wide tables
          still run edge to edge. */}
      <div className="py-2">{children}</div>
    </div>
  );
}

function RepairTypeTable({ repairType }: { repairType: InspectionTypeGroup }) {
  const t = useTranslations("Reports");
  return (
    <div className="overflow-hidden">
      <div className="bg-amber-50 px-3 py-1.5 border-b border-amber-100">
        <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide text-center">{repairType.name}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <TableHead className="h-8 text-[12px] text-gray-400 font-semibold border-r border-gray-200">{t("locomotive")}</TableHead>
            <TableHead className="h-8 text-[12px] text-gray-400 font-semibold border-r border-gray-200">{t("entered")}</TableHead>
            <TableHead className="h-8 text-[12px] text-gray-400 font-semibold">{t("exited")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repairType.locomotives.map((loco: InspectionTypeLocomotive) => (
            <TableRow key={loco.name} data-pdf-block className="border-b border-gray-200 hover:bg-gray-50/60">
              <TableCell className="font-semibold text-gray-800 text-sm border-r border-gray-200 py-1.5">{loco.name}</TableCell>
              <TableCell className="text-gray-600 text-sm border-r border-gray-200 py-1.5">{formatDate(loco.inspection_started_time)}</TableCell>
              <TableCell className="text-gray-600 text-sm py-1.5">{formatDate(loco.inspection_closed_time)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("Reports");
  return (
    <div className="flex items-center justify-center h-16">
      <p className="text-sm text-gray-400">{t("noData")}</p>
    </div>
  );
}
