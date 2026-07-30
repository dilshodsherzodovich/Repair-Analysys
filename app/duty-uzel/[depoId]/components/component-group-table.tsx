"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
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
import { EmptyState } from "@/ui/empty-state";
import { ComponentGroupDetails } from "@/api/types/component-registry";

interface ComponentGroupTableProps {
  data?: ComponentGroupDetails;
  isLoading?: boolean;
  /** No group picked yet — prompt instead of an empty table. */
  hasGroup: boolean;
  formatDate: (date: string) => string;
}

const CELL = "py-3 px-4 text-[#64748B] border-r border-[#E2E8F0] last:border-r-0";
const HEAD =
  "py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0";

export function ComponentGroupTable({
  data,
  isLoading,
  hasGroup,
  formatDate,
}: ComponentGroupTableProps) {
  const t = useTranslations("DutyUzelPage");

  const columns = [
    { key: "no", label: t("columns.no"), className: "w-14 min-w-[3.5rem]" },
    { key: "defect_date", label: t("columns.defect_date"), className: "min-w-[130px]" },
    { key: "locomotive", label: t("columns.locomotive"), className: "min-w-[150px]" },
    { key: "section", label: t("columns.section"), className: "min-w-[110px]" },
    { key: "reason", label: t("columns.reason"), className: "min-w-[220px]" },
    {
      key: "removed_manufacture_year",
      label: t("columns.removed_manufacture_year"),
      className: "min-w-[150px]",
    },
    {
      key: "removed_manufacture_factory",
      label: t("columns.removed_manufacture_factory"),
      className: "min-w-[170px]",
    },
    {
      key: "installed_manufacture_year",
      label: t("columns.installed_manufacture_year"),
      className: "min-w-[150px]",
    },
    {
      key: "installed_manufacture_factory",
      label: t("columns.installed_manufacture_factory"),
      className: "min-w-[170px]",
    },
    { key: "staff", label: t("columns.staff"), className: "min-w-[150px]" },
  ];

  if (!hasGroup) {
    return (
      <div className="rounded-lg border border-[#CAD5E2] bg-white p-8 text-center">
        <p className="font-medium text-[#0F172B]">{t("group_select_title")}</p>
        <p className="text-sm text-[#64748B] mt-1">
          {t("group_select_description")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#CAD5E2] overflow-hidden bg-white">
        <div className="bg-[#EFF6FF] px-4 py-3 border-b border-[#CAD5E2]">
          <Skeleton className="h-5 w-48 rounded-md" />
        </div>
        <Table className="w-full min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              {columns.map((column) => (
                <TableHead key={column.key} className={HEAD}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton
              rows={8}
              columns={columns.length}
              cellClassName="py-3 px-4"
            />
          </TableBody>
        </Table>
      </div>
    );
  }

  const components = data?.components ?? [];

  if (!components.length) {
    return (
      <div className="rounded-lg border border-[#CAD5E2] bg-white p-8">
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title={t("empty_title")}
          description={t("empty_description")}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#CAD5E2] overflow-hidden bg-white">
      <div className="bg-[#EFF6FF] px-4 py-3 border-b border-[#CAD5E2] flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#0F172B]">
          {data?.group?.name}
        </h3>
        <span className="text-sm font-medium text-[#475569] whitespace-nowrap">
          {t("group_total", { count: data?.total_count ?? 0 })}
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`${HEAD} ${column.className}`}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.map((component) => (
              <Fragment key={component.id}>
                <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9] border-b border-[#CAD5E2]">
                  <TableCell
                    colSpan={columns.length}
                    className="py-2.5 px-4 border-r-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#0F172B]">
                        {component.name}
                      </span>
                      <span className="inline-flex items-center justify-center rounded-full bg-[#2354bf] px-2.5 py-0.5 text-xs font-semibold text-white">
                        {component.count}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>

                {component.registries.length === 0 ? (
                  <TableRow className="border-b border-[#E2E8F0]">
                    <TableCell
                      colSpan={columns.length}
                      className="py-4 px-4 text-center text-sm text-[#64748B] border-r-0"
                    >
                      {t("empty_description")}
                    </TableCell>
                  </TableRow>
                ) : (
                  component.registries.map((registry, index) => (
                    <TableRow
                      key={registry.id}
                      className="hover:bg-[#F8FAFC] border-b border-[#E2E8F0] transition-colors"
                    >
                      <TableCell className={`${CELL} text-[#0F172B] font-medium`}>
                        {index + 1}
                      </TableCell>
                      <TableCell className={CELL}>
                        {formatDate(registry.defect_date)}
                      </TableCell>
                      <TableCell className={`${CELL} text-[#0F172B]`}>
                        {registry.locomotive}
                        {registry.locomotive_model
                          ? `-${registry.locomotive_model}`
                          : ""}
                      </TableCell>
                      <TableCell className={CELL}>
                        {registry.section || "—"}
                      </TableCell>
                      <TableCell className={CELL}>
                        <div className="max-w-[300px] whitespace-normal break-words">
                          {registry.reason || "—"}
                        </div>
                      </TableCell>
                      <TableCell className={CELL}>
                        {registry.removed_manufacture_year || "—"}
                      </TableCell>
                      <TableCell className={CELL}>
                        {registry.removed_manufacture_factory || "—"}
                      </TableCell>
                      <TableCell className={CELL}>
                        {registry.installed_manufacture_year || "—"}
                      </TableCell>
                      <TableCell className={CELL}>
                        {registry.installed_manufacture_factory || "—"}
                      </TableCell>
                      <TableCell className={CELL}>
                        {registry.staff || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
