"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { PageHeader } from "@/ui/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { TableSkeleton } from "@/ui/table-skeleton";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useReserve } from "@/api/hooks/use-reserve";
import type { ReserveItem } from "@/api/types/reserve";
import { getPageCount } from "@/lib/utils";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import type { UserData } from "@/api/types/auth";
import {
  PaginationEllipsis,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/pagination";
import { Badge } from "@/ui/badge";

type TabValue = "current" | "archive";

const TAB_TO_IS_ACTIVE: Record<TabValue, 0 | 1> = {
  current: 1,
  archive: 0,
};

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return format(d, "dd.MM.yyyy HH:mm");
  } catch {
    return "—";
  }
}

function getLocomotiveDisplay(item: ReserveItem): string {
  const loc = item.locomotive;
  if (!loc) return "—";
  const model = loc.locomotive_model?.name ?? "";
  return model ? `${loc.name} ${model}` : loc.name;
}

function getLocationDisplay(item: ReserveItem): string {
  const loc = item.locomotive;
  const locCat = loc?.location_category?.name;
  const locPlace = loc?.location?.name;
  if (locCat && locPlace) return `${locPlace} (${locCat})`;
  return locPlace ?? locCat ?? "—";
}

export default function RezervPage() {
  const currentUser: UserData | null =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  if (!currentUser || !canAccessSection(currentUser, "inspections")) {
    return <UnauthorizedPage />;
  }

  const t = useTranslations("RezervPage");
  const searchParams = useSearchParams();
  const { updateQuery, getQueryValue } = useFilterParams();

  const tab = (getQueryValue("tab") as TabValue) || "current";
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const currentPage = pageParam ? parseInt(pageParam, 10) || 1 : 1;
  const itemsPerPage = pageSizeParam ? parseInt(pageSizeParam, 10) || 10 : 10;

  const isActive = TAB_TO_IS_ACTIVE[tab];
  const requestParams = useMemo(
    () => ({
      is_active: isActive,
      page: currentPage,
      page_size: itemsPerPage,
    }),
    [isActive, currentPage, itemsPerPage]
  );

  const { data, isLoading } = useReserve(requestParams);

  const results = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = getPageCount(totalCount, itemsPerPage) || 1;

  useEffect(() => {
    const tabFromUrl = (searchParams.get("tab") as TabValue) || "current";
    if (tabFromUrl !== "current" && tabFromUrl !== "archive") {
      updateQuery({ tab: "current", page: "1" });
    }
  }, [searchParams, updateQuery]);

  const handleTabChange = useCallback(
    (value: string) => {
      const v = value as TabValue;
      updateQuery({ tab: v, page: "1" });
    },
    [updateQuery]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateQuery({ page: String(page) });
    },
    [updateQuery]
  );

  type ReserveRow = ReserveItem & { __displayIndex: number };
  const isArchiveTab = tab === "archive";
  const columnCount = isArchiveTab ? 7 : 6;

  const displayRows = useMemo<ReserveRow[]>(
    () =>
      results.map((row, i) => ({
        ...row,
        __displayIndex: (currentPage - 1) * itemsPerPage + i + 1,
      })),
    [results, currentPage, itemsPerPage]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="mb-4">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="bg-white border border-gray-200 p-1 gap-2 rounded-md inline-flex">
            <TabsTrigger
              value="current"
              className="px-3 py-2 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:hover:border-gray-300"
            >
              {t("tab_current")}
            </TabsTrigger>
            <TabsTrigger
              value="archive"
              className="px-3 py-2 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:hover:border-gray-300"
            >
              {t("tab_archive")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-lg border border-[#CAD5E2] overflow-hidden bg-white">
        {isLoading ? (
          <Table className="w-full min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <TableHead className="min-w-[50px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.no")}
                </TableHead>
                <TableHead className="min-w-[140px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.locomotive")}
                </TableHead>
                <TableHead className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.location")}
                </TableHead>
                <TableHead className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.start_date")}
                </TableHead>
                {isArchiveTab && (
                  <TableHead className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                    {t("columns.end_date")}
                  </TableHead>
                )}
                <TableHead className="min-w-[90px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.status")}
                </TableHead>
                <TableHead className="min-w-[100px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.command_number")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton
                rows={8}
                columns={columnCount}
                cellClassName="py-3 px-4"
              />
            </TableBody>
          </Table>
        ) : (
          <Table className="w-full min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <TableHead className="min-w-[50px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.no")}
                </TableHead>
                <TableHead className="min-w-[140px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.locomotive")}
                </TableHead>
                <TableHead className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.location")}
                </TableHead>
                <TableHead className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.start_date")}
                </TableHead>
                {isArchiveTab && (
                  <TableHead className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                    {t("columns.end_date")}
                  </TableHead>
                )}
                <TableHead className="min-w-[90px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.status")}
                </TableHead>
                <TableHead className="min-w-[100px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0">
                  {t("columns.command_number")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="py-8 text-center text-[#64748B]"
                  >
                    {t("empty_title")}
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-b-0"
                  >
                    <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0]">
                      {row.__displayIndex}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#0F172B] font-medium border-r border-[#E2E8F0]">
                      {getLocomotiveDisplay(row)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0]">
                      {getLocationDisplay(row)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0]">
                      {formatDate(row.start_date)}
                    </TableCell>
                    {isArchiveTab && (
                      <TableCell className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0]">
                        {formatDate(row.end_date)}
                      </TableCell>
                    )}
                    <TableCell className="py-3 px-4 border-r border-[#E2E8F0]">
                      <Badge variant={isArchiveTab ? "warning" : "success"}>
                        {isArchiveTab ? t("tab_archive") : t("tab_current")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#0F172B] border-r border-[#E2E8F0] last:border-r-0">
                      {row.command_number || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-[#64748B]">
            {t("pagination_summary", { total: totalCount, from: (currentPage - 1) * itemsPerPage + 1, to: Math.min(currentPage * itemsPerPage, totalCount) })}
          </p>
          <nav className="flex items-center gap-1" role="navigation" aria-label="pagination">
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            />
            <ul className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - currentPage) <= 1) return true;
                  return false;
                })
                .map((p, idx, arr) => {
                  const showLeftEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <li key={p} className="flex items-center gap-1">
                      {showLeftEllipsis && <PaginationEllipsis />}
                      <PaginationLink
                        onClick={() => handlePageChange(p)}
                        isActive={currentPage === p}
                      >
                        {p}
                      </PaginationLink>
                    </li>
                  );
                })}
            </ul>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            />
          </nav>
        </div>
      )}
    </div>
  );
}
