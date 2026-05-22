"use client";

import React, { useMemo, useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Settings2, Loader2 } from "lucide-react";
import { PageHeader } from "@/ui/page-header";
import { PermissionGuard } from "@/components/permission-guard";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { TableSkeleton } from "@/ui/table-skeleton";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useTxk13Report } from "@/api/hooks/use-txk13-report";
import type { Txk13Inspection, Txk13Locomotive } from "@/api/types/txk13-report";
import { canAccessSection, type Permission } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import type { UserData } from "@/api/types/auth";
import { BaselineModal } from "./baseline-modal";
import { txk13ReportService } from "@/api/services/txk13-report.service";

const DEFAULT_INSPECTION_IDS = [5, 6, 8, 15];

function formatNum(n: number): string {
  if (n == null) return "0";
  return n.toLocaleString("en-US");
}

function getInspectionMap(loco: Txk13Locomotive): Map<number, Txk13Inspection> {
  const map = new Map<number, Txk13Inspection>();
  for (const insp of loco.inspections) {
    map.set(insp.type_id, insp);
  }
  return map;
}

const FIXED_COL_COUNT = 7;
const INSP_SUB_COUNT = 6;

function BandajCell({ locoId, serverValue }: { locoId: number; serverValue: number | null }) {
  const [value, setValue] = useState(serverValue == null ? "" : String(serverValue));
  const [saving, setSaving] = useState(false);
  const committed = useRef<number | null>(serverValue);

  async function handleBlur() {
    const trimmed = value.trim();
    const parsed = trimmed === "" ? null : parseFloat(trimmed);
    if (trimmed !== "" && isNaN(parsed as number)) {
      setValue(committed.current == null ? "" : String(committed.current));
      return;
    }
    if (parsed === committed.current) return;
    setSaving(true);
    try {
      const result = await txk13ReportService.patchBandaj(locoId, parsed);
      committed.current = result.bandaj_thickness;
      setValue(result.bandaj_thickness == null ? "" : String(result.bandaj_thickness));
    } catch {
      setValue(committed.current == null ? "" : String(committed.current));
    } finally {
      setSaving(false);
    }
  }

  return (
    <TableCell className="p-0 text-center text-[#475569] border-r border-[#E2E8F0] relative">
      {saving ? (
        <Loader2 className="size-3.5 animate-spin text-[#2563EB] mx-auto my-2" />
      ) : (
        <input
          type="number"
          min={0}
          max={1000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.currentTarget.select()}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          onBlur={handleBlur}
          className="absolute inset-0 w-full h-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#93C5FD] focus:ring-1 focus:ring-[#93C5FD] px-2 text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      )}
    </TableCell>
  );
}

function inspBg(idx: number) {
  return idx % 2 === 0 ? "bg-[#F1F5F9]" : "bg-white";
}

function toDisplayDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function ManufactureDateCell({ locoId, serverValue }: { locoId: number; serverValue: string }) {
  const [value, setValue] = useState(serverValue ?? "");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const committed = useRef<string>(serverValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      try { inputRef.current.showPicker(); } catch { /* unsupported */ }
    }
  }, [editing]);

  async function patch(dateValue: string) {
    setSaving(true);
    setEditing(false);
    try {
      const result = await txk13ReportService.patchManufactureDate(locoId, dateValue);
      committed.current = result.manufacture_date;
      setValue(result.manufacture_date);
    } catch {
      setValue(committed.current);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newVal = e.target.value;
    setValue(newVal);
    if (/^\d{4}-\d{2}-\d{2}$/.test(newVal) && newVal !== committed.current) {
      patch(newVal);
    }
  }

  function handleBlur() {
    setEditing(false);
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setValue(committed.current);
    }
  }

  return (
    <TableCell
      className="py-2 px-2 text-[#475569] border-r border-[#E2E8F0] relative whitespace-nowrap cursor-pointer"
      onClick={() => !editing && !saving && setEditing(true)}
    >
      {saving ? (
        <Loader2 className="size-3.5 animate-spin text-[#2563EB]" />
      ) : editing ? (
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className="absolute inset-0 w-full h-full px-2 text-xs bg-white border border-[#93C5FD] ring-1 ring-[#93C5FD] outline-none text-[#475569]"
        />
      ) : (
        <span>{toDisplayDate(value)}</span>
      )}
    </TableCell>
  );
}

export default function LocomotiveMileageReportPage() {
  const t = useTranslations("LocomotiveMileageReportPage");
  const { updateQuery, getQueryValue } = useFilterParams();

  const currentUser: UserData | null =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  if (!currentUser || !canAccessSection(currentUser, "inspections")) {
    return <UnauthorizedPage />;
  }

  const organizationParam = getQueryValue("organization");
  const [selectedInspectionIds, setSelectedInspectionIds] = useState<number[]>(DEFAULT_INSPECTION_IDS);

  const [baselineModal, setBaselineModal] = useState<{
    locomotiveId: number;
    inspectionTypeId: number;
    locomotiveName: string;
    inspectionTypeName: string;
  } | null>(null);

  const [pendingBaselines, setPendingBaselines] = useState<Set<string>>(new Set());

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();
  const organizations = Array.isArray(organizationsData)
    ? organizationsData
    : (organizationsData as { results?: { id: number; name: string }[] } | undefined)
        ?.results ?? [];

  const organizationId = organizationParam ? Number(organizationParam) : undefined;

  const reportParams = useMemo(
    () => (organizationId != null ? { organization: organizationId } : null),
    [organizationId]
  );

  const { data: reportData, isLoading: isLoadingReport } = useTxk13Report(reportParams);

  // Non-admin: auto-set org
  useEffect(() => {
    if (!currentUser || currentUser.role === "admin") return;
    const userOrgId = (currentUser.branch as { organization?: { id: number } } | undefined)
      ?.organization?.id;
    if (userOrgId == null) return;
    if (organizationParam !== String(userOrgId)) {
      updateQuery({ organization: String(userOrgId) });
    }
  }, [currentUser, organizationParam, updateQuery]);

  // Auto-select first org
  useEffect(() => {
    if (organizationId != null || isLoadingOrganizations || organizations.length === 0) return;
    const firstOrg = organizations[0] as { id: number } | undefined;
    if (firstOrg?.id != null) {
      updateQuery({ organization: String(firstOrg.id) });
    }
  }, [organizationId, isLoadingOrganizations, organizations, updateQuery]);

  // Collect unique inspection types across all orgs, sorted by type_id
  const inspectionTypes = useMemo((): { type_id: number; type: string }[] => {
    if (!reportData?.data) return [];
    const map = new Map<number, string>();
    for (const org of reportData.data) {
      for (const loco of org.locomotives) {
        for (const insp of loco.inspections) {
          map.set(insp.type_id, insp.type);
        }
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([type_id, type]) => ({ type_id, type }));
  }, [reportData]);

  const selectedInspectionTypes = useMemo(
    () => inspectionTypes.filter((i) => selectedInspectionIds.includes(i.type_id)),
    [inspectionTypes, selectedInspectionIds]
  );

  const totalColCount = FIXED_COL_COUNT + selectedInspectionTypes.length * INSP_SUB_COUNT;

  const toggleInspection = (typeId: number) => {
    setSelectedInspectionIds((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const orgOptions = useMemo(
    () => [
      { label: t("choose_organization"), value: "" },
      ...organizations.map((org: { id: number; name: string }) => ({
        label: org.name,
        value: String(org.id),
      })),
    ],
    [organizations, t]
  );

  const orgs = reportData?.data ?? [];
  const isEmpty = !isLoadingReport && orgs.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Organization select */}
        <PermissionGuard permission={"choose_inspection_organization" as Permission}>
          <select
            value={organizationParam}
            onChange={(e) => updateQuery({ organization: e.target.value })}
            disabled={isLoadingOrganizations}
            className="h-10 min-w-[220px] max-w-[300px] px-3 border border-[#CAD5E2] rounded-md bg-white text-sm text-[#0F172B] focus:outline-none focus:ring-0 focus:border-[#CAD5E2] disabled:opacity-60 cursor-pointer"
          >
            {orgOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </PermissionGuard>

        {/* Divider */}
        {inspectionTypes.length > 0 && (
          <div className="h-8 w-px bg-[#E2E8F0] shrink-0" />
        )}

        {/* Inspection type checkboxes */}
        {inspectionTypes.map((insp) => (
          <label
            key={insp.type_id}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={selectedInspectionIds.includes(insp.type_id)}
              onChange={() => toggleInspection(insp.type_id)}
              className="w-4 h-4 rounded border-[#CAD5E2] text-blue-600 cursor-pointer accent-blue-600"
            />
            <span className="text-sm text-[#0F172B] whitespace-nowrap font-medium">
              {insp.type}
            </span>
          </label>
        ))}
      </div>

      <div className="sticky top-0 rounded-lg border border-[#CAD5E2] overflow-x-auto overflow-y-auto h-[80vh] bg-white">
        <table className="w-full text-xs border-collapse">
          <TableHeader>
            {/* Row 1: fixed headers + inspection group headers */}
            <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <TableHead rowSpan={2} className="sticky top-0 left-0 z-30 py-2 px-2 text-[#475569] font-medium border-r border-[#E2E8F0] text-center whitespace-nowrap bg-[#F8FAFC] min-w-[40px]">
                {t("columns.no")}
              </TableHead>
              <TableHead rowSpan={2} className="sticky top-0 left-[40px] z-30 py-2 px-2 text-[#475569] font-medium border-r border-[#E2E8F0] whitespace-nowrap bg-[#F8FAFC] min-w-[72px]">
                {t("columns.series")}
              </TableHead>
              <TableHead rowSpan={2} className="sticky top-0 left-[112px] z-30 py-2 px-2 text-[#475569] font-medium border-r border-[#E2E8F0] whitespace-nowrap bg-[#F8FAFC] min-w-[72px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                {t("columns.number")}
              </TableHead>
              <TableHead rowSpan={2} className="sticky top-0 z-20 py-2 px-2 text-[#475569] font-medium border-r border-[#E2E8F0] whitespace-nowrap bg-[#F8FAFC]">
                {t("columns.manufactured_date")}
              </TableHead>
              <TableHead rowSpan={2} className="sticky top-0 z-20 py-2 px-2 text-[#475569] font-medium border-r border-[#E2E8F0] whitespace-nowrap bg-[#F8FAFC]">
                {t("columns.bandaj_mm")}
              </TableHead>
              <TableHead rowSpan={2} className="sticky top-0 z-20 py-2 px-2 text-[#475569] font-medium border-r border-[#E2E8F0] whitespace-nowrap bg-[#F8FAFC]">
                {t("columns.total_mileage")}
              </TableHead>
              <TableHead rowSpan={2} className="sticky top-0 z-20 py-2 px-2 text-[#475569] font-medium border-r border-[#E2E8F0] whitespace-nowrap bg-[#F8FAFC]">
                {t("columns.avg_monthly_mileage")}
              </TableHead>
              {selectedInspectionTypes.map((insp, idx) => (
                <TableHead
                  key={insp.type_id}
                  colSpan={INSP_SUB_COUNT}
                  className={`sticky top-0 z-20 py-2 px-2 text-[#475569] font-semibold text-center border-r border-[#E2E8F0] ${inspBg(idx)} ${idx === selectedInspectionTypes.length - 1 ? "border-r-0" : ""}`}
                >
                  {insp.type}
                </TableHead>
              ))}
            </TableRow>
            {/* Row 2: sub-headers for each inspection type */}
            <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
              {selectedInspectionTypes.map((insp, idx) => [
                <TableHead key={`${insp.type_id}-sana`} className={`sticky top-[33px] z-20 py-2 px-2 text-[#64748B] font-normal border-r border-[#E2E8F0] whitespace-nowrap ${inspBg(idx)}`}>
                  {t("columns.sana")}
                </TableHead>,
                <TableHead key={`${insp.type_id}-tamirdan`} className={`sticky top-[33px] z-20 py-2 px-2 text-[#64748B] font-normal border-r border-[#E2E8F0] whitespace-nowrap ${inspBg(idx)}`}>
                  {t("columns.tamirdan_km")}
                </TableHead>,
                <TableHead key={`${insp.type_id}-norma`} className={`sticky top-[33px] z-20 py-2 px-2 text-[#64748B] font-normal border-r border-[#E2E8F0] whitespace-nowrap ${inspBg(idx)}`}>
                  {t("columns.norma")}
                </TableHead>,
                <TableHead key={`${insp.type_id}-qoldiq`} className={`sticky top-[33px] z-20 py-2 px-2 text-[#64748B] font-normal border-r border-[#E2E8F0] whitespace-nowrap ${inspBg(idx)}`}>
                  {t("columns.qoldiq")}
                </TableHead>,
                <TableHead
                  key={`${insp.type_id}-keyingi`}
                  className={`sticky top-[33px] z-20 py-2 px-2 text-[#64748B] font-normal border-r border-[#E2E8F0] whitespace-nowrap ${inspBg(idx)}`}
                >
                  {t("columns.keyingi_sana")}
                </TableHead>,
                <TableHead
                  key={`${insp.type_id}-baseline`}
                  className={`sticky top-[33px] z-20 py-2 px-2 text-[#64748B] font-normal border-r border-[#E2E8F0] whitespace-nowrap text-center ${inspBg(idx)} ${idx === selectedInspectionTypes.length - 1 ? "border-r-0" : ""}`}
                >
                  {t("columns.sozlash")}
                </TableHead>,
              ])}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoadingReport ? (
              <TableSkeleton
                rows={8}
                columns={totalColCount || FIXED_COL_COUNT}
                cellClassName="py-2 px-2"
              />
            ) : isEmpty ? (
              <TableRow>
                <TableCell
                  colSpan={totalColCount}
                  className="py-8 text-center text-[#64748B]"
                >
                  {t("empty_title")}
                </TableCell>
              </TableRow>
            ) : (
              orgs.map((org) => (
                <React.Fragment key={org.organization_name}>
                  {/* Org header row */}
                  <TableRow className="bg-[#EFF6FF] hover:bg-[#EFF6FF]">
                    <TableCell
                      colSpan={totalColCount}
                      className="py-2 px-3 font-semibold text-[#1e40af] border-b border-[#E2E8F0] text-sm"
                    >
                      {org.organization_name}
                      <span className="ml-2 font-normal text-[#64748B]">
                        ({t("locomotives_count", { count: org.locomotives.length })})
                      </span>
                    </TableCell>
                  </TableRow>
                  {/* Locomotive rows */}
                  {org.locomotives.map((loco) => {
                    const inspMap = getInspectionMap(loco);
                    return (
                      <TableRow
                        key={`${org.organization_name}-${loco.index}`}
                        className="group hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-b-0"
                      >
                        <TableCell className="sticky left-0 z-10 py-2 px-2 text-center text-[#475569] border-r border-[#E2E8F0] bg-white group-hover:bg-[#F8FAFC] min-w-[40px]">
                          {loco.index}
                        </TableCell>
                        <TableCell className="sticky left-[40px] z-10 py-2 px-2 text-[#0F172B] border-r border-[#E2E8F0] whitespace-nowrap bg-white group-hover:bg-[#F8FAFC] min-w-[72px]">
                          {loco.series}
                        </TableCell>
                        <TableCell className="sticky left-[112px] z-10 py-2 px-2 font-mono text-[#0F172B] border-r border-[#E2E8F0] bg-white group-hover:bg-[#F8FAFC] min-w-[72px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                          {loco.number}
                        </TableCell>
                        <ManufactureDateCell locoId={loco.id} serverValue={loco.manufactured_date} />
                        <BandajCell locoId={loco.id} serverValue={loco.bandaj_thickness} />
                        <TableCell className="py-2 px-2 text-right text-[#475569] border-r border-[#E2E8F0]">
                          {formatNum(loco.total_mileage)}
                        </TableCell>
                        <TableCell className="py-2 px-2 text-right text-[#475569] border-r border-[#E2E8F0]">
                          {formatNum(loco.average_monthly_mileage)}
                        </TableCell>
                        {selectedInspectionTypes.map((inspType, idx) => {
                          const insp = inspMap.get(inspType.type_id);
                          const isLast = idx === selectedInspectionTypes.length - 1;
                          const isSaving = pendingBaselines.has(`${loco.id}-${inspType.type_id}`);

                          const gearButton = (
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() =>
                                setBaselineModal({
                                  locomotiveId: loco.id,
                                  inspectionTypeId: inspType.type_id,
                                  locomotiveName: `${loco.series} ${loco.number}`,
                                  inspectionTypeName: inspType.type,
                                })
                              }
                              className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[#E2E8F0] text-[#94A3B8] hover:text-[#475569] transition-colors disabled:cursor-not-allowed"
                              title={t("columns.sozlash")}
                            >
                              {isSaving
                                ? <Loader2 className="size-3.5 animate-spin text-[#2563EB]" />
                                : <Settings2 className="size-3.5" />}
                            </button>
                          );

                          if (!insp) {
                            return [
                              ...Array.from({ length: INSP_SUB_COUNT - 1 }, (_, i) => (
                                <TableCell
                                  key={`${loco.index}-${inspType.type_id}-empty-${i}`}
                                  className={`py-2 px-2 text-[#CBD5E1] text-center border-r border-[#E2E8F0] ${inspBg(idx)}`}
                                >
                                  -
                                </TableCell>
                              )),
                              <TableCell
                                key={`${loco.index}-${inspType.type_id}-baseline-empty`}
                                className={`py-2 px-1 text-center border-r border-[#E2E8F0] ${inspBg(idx)} ${isLast ? "border-r-0" : ""}`}
                              >
                                {gearButton}
                              </TableCell>,
                            ];
                          }
                          return [
                            <TableCell key={`${loco.index}-${inspType.type_id}-sana`} className={`py-2 px-2 text-[#475569] border-r border-[#E2E8F0] whitespace-nowrap ${inspBg(idx)}`}>
                              {insp.last_date === "-" ? "-" : insp.last_date}
                            </TableCell>,
                            <TableCell key={`${loco.index}-${inspType.type_id}-tamirdan`} className={`py-2 px-2 text-right text-[#2563EB] border-r border-[#E2E8F0] ${inspBg(idx)}`}>
                              {formatNum(insp.mileage_since_repair)}
                            </TableCell>,
                            <TableCell key={`${loco.index}-${inspType.type_id}-norma`} className={`py-2 px-2 text-right text-[#475569] border-r border-[#E2E8F0] ${inspBg(idx)}`}>
                              {formatNum(insp.norm)}
                            </TableCell>,
                            <TableCell
                              key={`${loco.index}-${inspType.type_id}-qoldiq`}
                              className={`py-2 px-2 text-right border-r border-[#E2E8F0] ${inspBg(idx)} ${insp.difference < 0 ? "text-[#DC2626]" : "text-[#475569]"}`}
                            >
                              {formatNum(insp.difference)}
                            </TableCell>,
                            <TableCell
                              key={`${loco.index}-${inspType.type_id}-keyingi`}
                              className={`py-2 px-2 text-[#475569] border-r border-[#E2E8F0] whitespace-nowrap ${inspBg(idx)}`}
                            >
                              {insp.next_repair_date === "-" ? "-" : insp.next_repair_date}
                            </TableCell>,
                            <TableCell
                              key={`${loco.index}-${inspType.type_id}-baseline`}
                              className={`py-2 px-1 text-center border-r border-[#E2E8F0] ${inspBg(idx)} ${isLast ? "border-r-0" : ""}`}
                            >
                              {gearButton}
                            </TableCell>,
                          ];
                        })}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </table>
      </div>

      <BaselineModal
        isOpen={!!baselineModal}
        onClose={() => setBaselineModal(null)}
        locomotiveId={baselineModal?.locomotiveId ?? 0}
        inspectionTypeId={baselineModal?.inspectionTypeId ?? 0}
        locomotiveName={baselineModal?.locomotiveName ?? ""}
        inspectionTypeName={baselineModal?.inspectionTypeName ?? ""}
        onPendingChange={(pending, key) => {
          setPendingBaselines((prev) => {
            const next = new Set(prev);
            pending ? next.add(key) : next.delete(key);
            return next;
          });
        }}
      />
    </div>
  );
}
