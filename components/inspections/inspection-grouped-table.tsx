"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { TableSkeleton } from "@/ui/table-skeleton";
import { Skeleton } from "@/ui/skeleton";
import { Badge } from "@/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { MoreVertical, Pencil, Loader2 } from "lucide-react";
import { Inspection } from "@/api/types/inspections";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import { useUpdateInspectionSection } from "@/api/hooks/use-inspections";
import type { UserData } from "@/api/types/auth";

const INSPECTION_SECTION_OPTIONS = [
  { value: "A", labelKey: "section_A" },
  { value: "B", labelKey: "section_B" },
  { value: "V", labelKey: "section_V" },
  { value: "Cabin1", labelKey: "section_Cabin1" },
  { value: "Cabin2", labelKey: "section_Cabin2" },
] as const;

function formatCreatedTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return format(d, "dd.MM.yyyy HH:mm");
  } catch {
    return "—";
  }
}

function getLocomotiveDisplay(inspection: Inspection): string {
  if (inspection.locomotive) {
    const name = inspection.locomotive.name;
    const model = inspection.locomotive.locomotive_model?.name ?? "";
    return model ? `${name} ${model}` : name;
  }
  return inspection.external_locomotive || "—";
}

function getBranchName(inspection: Inspection): string {
  return inspection.branch?.name ?? "—";
}

function getIntervalBadge(inspection: Inspection): {
  text: string;
  variant: "success" | "warning" | "default";
} {
  const remaining = inspection.inspection_remaining_time;
  const hourInterval = inspection.hour_interval;
  const mileageInterval = inspection.mileage_interval;
  if (hourInterval && hourInterval > 0) {
    const text = `${remaining}/${hourInterval}`;
    const variant =
      remaining <= 0 ? "warning" : remaining < hourInterval ? "success" : "default";
    return { text, variant };
  }
  if (mileageInterval && mileageInterval > 0) {
    const start = inspection.inspection_start_mileage ?? 0;
    const text = `${start}/${mileageInterval}`;
    const variant = remaining <= 0 ? "warning" : "success";
    return { text, variant };
  }
  return { text: `${remaining}`, variant: "default" as const };
}

export interface InspectionsGroupedTableProps {
  inspections: Inspection[];
  isLoading?: boolean;
  onAction?: (action: "edit" | "view", inspection: Inspection) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function InspectionsGroupedTable({
  inspections,
  isLoading,
  onAction,
  emptyTitle,
  emptyDescription,
}: InspectionsGroupedTableProps) {
  const t = useTranslations("InspectionsPage");
  const [editingSectionForId, setEditingSectionForId] = useState<number | null>(
    null
  );

  const currentUser: UserData | null =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const canEditSection = hasPermission(
    currentUser,
    "edit_inspection_location_section"
  );

  const updateSectionMutation = useUpdateInspectionSection();

  const getSectionSelectValue = (section: string | undefined) => {
    if (!section) return "";
    const byValue = INSPECTION_SECTION_OPTIONS.find(
      (opt) => opt.value === section
    );
    if (byValue) return byValue.value;
    const byLabelKey = INSPECTION_SECTION_OPTIONS.find(
      (opt) => t(opt.labelKey) === section
    );
    return byLabelKey ? byLabelKey.value : INSPECTION_SECTION_OPTIONS[0].value;
  };

  const getSectionDisplayLabel = (section: string | undefined) => {
    if (!section) return "—";
    const opt = INSPECTION_SECTION_OPTIONS.find((o) => o.value === section);
    if (opt) return t(opt.labelKey);
    const byTranslated = INSPECTION_SECTION_OPTIONS.find(
      (o) => t(o.labelKey) === section
    );
    return byTranslated ? t(byTranslated.labelKey) : section;
  };

  const updatingSectionId = updateSectionMutation.variables?.id ?? null;
  const isSectionCellUpdating = (inspectionId: number) =>
    updateSectionMutation.isPending && updatingSectionId === inspectionId;

  const groupedByType = useMemo(() => {
    const map = new Map<number, { name: string; items: Inspection[] }>();
    for (const inv of inspections ?? []) {
      const typeId = inv?.inspection_type?.id ?? 0;
      const name = inv?.inspection_type?.name ?? t("columns.inspection_type");
      if (!map.has(typeId)) map.set(typeId, { name, items: [] });
      map.get(typeId)?.items.push(inv);
    }
    return Array.from(map.entries()).map(([id, { name, items }]) => ({
      id,
      name,
      items,
    }));
  }, [inspections, t]);

  const columnCount = onAction ? 11 : 10;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((groupKey) => (
          <div
            key={groupKey}
            className="rounded-lg border border-[#CAD5E2] overflow-hidden"
          >
            <div className="bg-[#EFF6FF] px-4 py-3 border-b border-[#CAD5E2]">
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Table className="w-full min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  {Array.from({ length: columnCount }).map((_, i) => (
                    <TableHead
                      key={i}
                      className="py-3 px-4 border-r border-[#E2E8F0] last:border-r-0"
                    >
                      <Skeleton className="h-4 w-full max-w-[80px] rounded-md" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableSkeleton
                  rows={5}
                  columns={columnCount}
                  cellClassName="py-3 px-4"
                />
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    );
  }

  if (!inspections.length) {
    return (
      <div className="rounded-lg border border-[#CAD5E2] bg-white p-8 text-center">
        <p className="font-medium text-[#0F172B]">{emptyTitle ?? t("empty_title")}</p>
        <p className="text-sm text-[#64748B] mt-1">
          {emptyDescription ?? t("empty_description")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedByType?.map((group) => (
        <div key={group.id} className="rounded-lg border border-[#CAD5E2] overflow-hidden">
          <div className="bg-[#EFF6FF] px-4 py-2 border-b border-[#CAD5E2]">
            <h3 className="text-xl font-semibold text-[#0F172B]">{group?.name}</h3>
          </div>
          <Table className="w-full min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <TableHead className="w-14 min-w-[3.5rem] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.no")}
                </TableHead>
                <TableHead className="min-w-[140px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.locomotive")}
                </TableHead>
                <TableHead className="min-w-[160px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.xkp")}
                </TableHead>
                <TableHead className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.inspection_type")}
                </TableHead>
                <TableHead className="min-w-[80px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.section")}
                </TableHead>
                <TableHead className="min-w-[100px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.comment")}
                </TableHead>
                <TableHead className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.author")}
                </TableHead>
                <TableHead className="min-w-[130px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.opened_time")}
                </TableHead>
                <TableHead className="min-w-[100px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.interval")}
                </TableHead>
                <TableHead className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.status")}
                </TableHead>
                {onAction && (
                  <TableHead className="w-[100px] min-w-[100px] py-3 px-4 text-center text-[#475569] font-medium">
                    {t("columns.actions")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group?.items?.map((inspection, index) => {
                const interval = getIntervalBadge(inspection);
                return (
                  <TableRow
                    key={inspection.id}
                    className="hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-b-0"
                  >
                    <TableCell className="py-3 px-4 text-[#0F172B] font-medium border-r border-[#E2E8F0] last:border-r-0">
                      {index + 1}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#0F172B] border-r border-[#E2E8F0] last:border-r-0">
                      {getLocomotiveDisplay(inspection)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0] last:border-r-0">
                      {getBranchName(inspection)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0] last:border-r-0">
                      {inspection?.inspection_type?.name ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0] last:border-r-0">
                      {isSectionCellUpdating(inspection.id) ? (
                        <span className="inline-flex items-center gap-2 text-[#64748B]">
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                          <span className="text-sm">
                            {t("section_updating")}
                          </span>
                        </span>
                      ) : canEditSection &&
                        inspection.locomotive &&
                        editingSectionForId === inspection.id ? (
                        <Select
                          value={getSectionSelectValue(inspection.section)}
                          onValueChange={(value) => {
                            updateSectionMutation.mutate(
                              {
                                id: inspection.id,
                                payload: { section: value },
                              },
                              {
                                onSettled: () =>
                                  setEditingSectionForId(null),
                              }
                            );
                          }}
                          disabled={updateSectionMutation.isPending}
                        >
                          <SelectTrigger className="h-8 min-w-[120px] border-[#E2E8F0]">
                            <SelectValue placeholder={t("columns.section")} />
                          </SelectTrigger>
                          <SelectContent>
                            {INSPECTION_SECTION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {t(opt.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          {getSectionDisplayLabel(inspection?.section)}
                          {canEditSection && inspection.locomotive && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingSectionForId(inspection.id)
                              }
                              className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172B]"
                              aria-label={t("action_edit")}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0] last:border-r-0">
                      {inspection?.comment || "—"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0] last:border-r-0">
                      {inspection?.author?.first_name
                        ? `${inspection?.author?.first_name} ${inspection?.author?.last_name || ""}`.trim()
                        : inspection?.author?.username ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0] last:border-r-0">
                      {formatCreatedTime(inspection?.created_time)}
                    </TableCell>
                    <TableCell className="py-3 px-4 border-r border-[#E2E8F0] last:border-r-0">
                      <Badge
                        variant={
                          interval?.variant === "success"
                            ? "success"
                            : interval?.variant === "warning"
                              ? "warning"
                              : "secondary"
                        }
                        className={cn(
                          interval?.variant === "success" && "bg-emerald-500 text-white",
                          interval?.variant === "warning" && "bg-amber-500 text-white"
                        )}
                      >
                        {interval.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 border-r border-[#E2E8F0] last:border-r-0">
                      <Badge variant="warning" className="bg-amber-500 text-white">
                        {t("status_in_progress")}
                      </Badge>
                    </TableCell>
                    {onAction && (
                      <TableCell className="py-3 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-[#E2E8F0] inline-flex items-center justify-center"
                              aria-label={t("columns.actions")}
                            >
                              <MoreVertical className="h-4 w-4 text-[#64748B]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onAction("view", inspection)}
                            >
                              {t("action_view")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onAction("edit", inspection)}
                            >
                              {t("action_edit")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
