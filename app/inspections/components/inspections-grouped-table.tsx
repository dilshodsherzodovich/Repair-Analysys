"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Badge } from "@/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Inspection } from "@/api/types/inspections";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

  const groupedByType = useMemo(() => {
    const map = new Map<number, { name: string; items: Inspection[] }>();
    for (const inv of inspections) {
      const typeId = inv.inspection_type?.id ?? 0;
      const name = inv.inspection_type?.name ?? t("columns.inspection_type");
      if (!map.has(typeId)) map.set(typeId, { name, items: [] });
      map.get(typeId)!.items.push(inv);
    }
    return Array.from(map.entries()).map(([id, { name, items }]) => ({
      id,
      name,
      items,
    }));
  }, [inspections, t]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#CAD5E2] overflow-hidden">
        <div className="h-64 bg-[#F8FAFC] animate-pulse flex items-center justify-center text-[#64748B] text-sm">
          {t("loading")}
        </div>
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
      {groupedByType.map((group) => (
        <div key={group.id} className="rounded-lg border border-[#CAD5E2] overflow-hidden">
          <div className="bg-[#EFF6FF] px-4 py-2 border-b border-[#CAD5E2]">
            <h3 className="text-sm font-semibold text-[#0F172B]">{group.name}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="w-12 text-[#475569] font-medium">
                  {t("columns.no")}
                </TableHead>
                <TableHead className="text-[#475569] font-medium">
                  {t("columns.locomotive")}
                </TableHead>
                <TableHead className="text-[#475569] font-medium">
                  {t("columns.xkp")}
                </TableHead>
                <TableHead className="text-[#475569] font-medium">
                  {t("columns.inspection_type")}
                </TableHead>
                <TableHead className="text-[#475569] font-medium">
                  {t("columns.section")}
                </TableHead>
                <TableHead className="text-[#475569] font-medium">
                  {t("columns.comment")}
                </TableHead>
                <TableHead className="text-[#475569] font-medium">
                  {t("columns.author")}
                </TableHead>
                <TableHead className="text-[#475569] font-medium">
                  {t("columns.created_time")}
                </TableHead>
                <TableHead className="text-[#475569] font-medium">
                  {t("columns.interval")}
                </TableHead>
                <TableHead className="text-[#475569] font-medium">
                  {t("columns.status")}
                </TableHead>
                {onAction && (
                  <TableHead className="w-[100px] text-center text-[#475569] font-medium">
                    {t("columns.actions")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((inspection, index) => {
                const interval = getIntervalBadge(inspection);
                return (
                  <TableRow
                    key={inspection.id}
                    className="hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-b-0"
                  >
                    <TableCell className="text-[#0F172B] font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-[#0F172B]">
                      {getLocomotiveDisplay(inspection)}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {getBranchName(inspection)}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {inspection.inspection_type?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {inspection.section || "—"}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {inspection.comment || "—"}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {inspection.author?.first_name
                        ? `${inspection.author.first_name} ${inspection.author.last_name || ""}`.trim()
                        : inspection.author?.username ?? "—"}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {formatCreatedTime(inspection.created_time)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          interval.variant === "success"
                            ? "success"
                            : interval.variant === "warning"
                              ? "warning"
                              : "secondary"
                        }
                        className={cn(
                          interval.variant === "success" && "bg-emerald-500 text-white",
                          interval.variant === "warning" && "bg-amber-500 text-white"
                        )}
                      >
                        {interval.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning" className="bg-amber-500 text-white">
                        {t("status_in_progress")}
                      </Badge>
                    </TableCell>
                    {onAction && (
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-[#E2E8F0] inline-flex items-center justify-center"
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
