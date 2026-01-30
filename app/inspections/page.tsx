"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import { Button } from "@/ui/button";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { getPageCount } from "@/lib/utils";
import { useInspections } from "@/api/hooks/use-inspections";
import { Inspection } from "@/api/types/inspections";
import { InspectionsGroupedTable } from "./components/inspections-grouped-table";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { format } from "date-fns";

type TabValue = "in_progress" | "archive" | "cancelled";

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

function getIntervalDisplay(inspection: Inspection): string {
  const remaining = inspection.inspection_remaining_time;
  const hourInterval = inspection.hour_interval;
  const mileageInterval = inspection.mileage_interval;
  if (hourInterval && hourInterval > 0) return `${remaining}/${hourInterval}`;
  if (mileageInterval && mileageInterval > 0) {
    const start = inspection.inspection_start_mileage ?? 0;
    return `${start}/${mileageInterval}`;
  }
  return String(remaining);
}

export default function InspectionsPage() {
  const t = useTranslations("InspectionsPage");
  const searchParams = useSearchParams();
  const { updateQuery, getQueryValue } = useFilterParams();

  const tab = (getQueryValue("tab") as TabValue) || "in_progress";
  const q = getQueryValue("q");
  const organizationParam = getQueryValue("organization");
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const { data: organizationsData } = useOrganizations({ no_page: true });

  const isInProgress = tab === "in_progress";
  const isArchive = tab === "archive";
  const isCancelled = tab === "cancelled";

  const inProgressParams = useMemo(
    () => ({
      is_closed: false,
      no_page: true,
      organization: organizationParam ? Number(organizationParam) : undefined,
      search: q || undefined,
    }),
    [organizationParam, q]
  );

  const archiveParams = useMemo(
    () => ({
      is_closed: true,
      is_cancelled: false,
      page: currentPage,
      page_size: itemsPerPage,
      organization: organizationParam ? Number(organizationParam) : undefined,
      search: q || undefined,
    }),
    [currentPage, itemsPerPage, organizationParam, q]
  );

  const cancelledParams = useMemo(
    () => ({
      is_cancelled: true,
      page: currentPage,
      page_size: itemsPerPage,
      organization: organizationParam ? Number(organizationParam) : undefined,
      search: q || undefined,
    }),
    [currentPage, itemsPerPage, organizationParam, q]
  );

  const { data: inProgressData, isLoading: loadingInProgress } = useInspections(
    isInProgress ? inProgressParams : undefined,
    { enabled: isInProgress }
  );
  const { data: archiveData, isLoading: loadingArchive } = useInspections(
    isArchive ? archiveParams : undefined,
    { enabled: isArchive }
  );
  const { data: cancelledData, isLoading: loadingCancelled } = useInspections(
    isCancelled ? cancelledParams : undefined,
    { enabled: isCancelled }
  );

  const inProgressList = inProgressData?.results ?? [];
  const archiveList = archiveData?.results ?? [];
  const cancelledList = cancelledData?.results ?? [];
  const archiveTotal = archiveData?.count ?? 0;
  const cancelledTotal = cancelledData?.count ?? 0;
  const archiveTotalPages = getPageCount(archiveTotal, itemsPerPage) || 1;
  const cancelledTotalPages = getPageCount(cancelledTotal, itemsPerPage) || 1;

  const handleTabChange = useCallback(
    (value: string) => {
      updateQuery({ tab: value, page: "1" });
    },
    [updateQuery]
  );

  const handleAddFromOtherOrg = useCallback(() => {
    // Placeholder for "Boshqa tashkilotdan" action
  }, []);

  const columns: TableColumn<Inspection>[] = useMemo(
    () => [
      {
        key: "no",
        header: t("columns.no"),
        accessor: (_, index) => (currentPage - 1) * itemsPerPage + (index ?? 0) + 1,
      },
      {
        key: "locomotive",
        header: t("columns.locomotive"),
        accessor: (row) => getLocomotiveDisplay(row),
      },
      {
        key: "xkp",
        header: t("columns.xkp"),
        accessor: (row) => getBranchName(row),
      },
      {
        key: "inspection_type",
        header: t("columns.inspection_type"),
        accessor: (row) => row.inspection_type?.name ?? "—",
      },
      {
        key: "section",
        header: t("columns.section"),
        accessor: (row) => row.section || "—",
      },
      {
        key: "comment",
        header: t("columns.comment"),
        accessor: (row) => row.comment || "—",
      },
      {
        key: "author",
        header: t("columns.author"),
        accessor: (row) =>
          row.author?.first_name
            ? `${row.author.first_name} ${row.author.last_name || ""}`.trim()
            : row.author?.username ?? "—",
      },
      {
        key: "created_time",
        header: t("columns.created_time"),
        accessor: (row) => formatCreatedTime(row.created_time),
      },
      {
        key: "interval",
        header: t("columns.interval"),
        accessor: (row) => getIntervalDisplay(row),
      },
      {
        key: "status",
        header: t("columns.status"),
        accessor: (row) => {
          if (row.is_cancelled) return t("status_cancelled");
          if (row.is_closed) return t("status_archive");
          return t("status_in_progress");
        },
        className: "w-[140px]",
      },
    ],
    [t, currentPage, itemsPerPage]
  );

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="px-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4">
          <div className="min-w-[200px] flex-1 max-w-[400px] flex-shrink-0">
            <input
              type="text"
              placeholder={t("search_placeholder")}
              className="w-full h-10 py-2 px-4 border border-[#CAD5E2] rounded-md bg-white placeholder:text-[#90A1B9] text-sm text-[#0F172B] focus:border-[#CAD5E2] focus:outline-none"
              value={q}
              onChange={(e) => updateQuery({ q: e.target.value })}
            />
          </div>
          <div className="min-w-[200px] flex-shrink-0">
            <Select
              value={organizationParam || "__all__"}
              onValueChange={(v) =>
                updateQuery({ organization: v === "__all__" ? "" : v })
              }
            >
              <SelectTrigger className="h-10 min-w-[200px] max-w-[300px]">
                <SelectValue placeholder={t("filter_all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("filter_all")}</SelectItem>
                {(organizationsData ?? []).map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto shrink-0 flex items-center gap-2">
            <Tabs value={tab} onValueChange={handleTabChange}>
              <TabsList className="bg-[#F1F5F9] p-1 gap-0 border-0 rounded-lg inline-flex h-10">
                <TabsTrigger
                  value="in_progress"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <LayoutGrid className="h-4 w-4" />
                  {t("tab_in_progress")}
                </TabsTrigger>
                <TabsTrigger
                  value="archive"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {t("tab_archive")}
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {t("tab_cancelled")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              onClick={handleAddFromOtherOrg}
              className="h-10 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("add_from_other_org")}
            </Button>
          </div>
        </div>

        {isInProgress && (
          <InspectionsGroupedTable
            inspections={inProgressList}
            isLoading={loadingInProgress}
            emptyTitle={t("empty_title")}
            emptyDescription={t("empty_description")}
          />
        )}

        {isArchive && (
          <PaginatedTable<Inspection>
            columns={columns}
            data={archiveList}
            isLoading={loadingArchive}
            getRowId={(row) => row.id}
            totalPages={archiveTotalPages}
            totalItems={archiveTotal}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            updateQueryParams={true}
            emptyTitle={t("empty_title")}
            emptyDescription={t("empty_description")}
            showActions={false}
          />
        )}

        {isCancelled && (
          <PaginatedTable<Inspection>
            columns={columns}
            data={cancelledList}
            isLoading={loadingCancelled}
            getRowId={(row) => row.id}
            totalPages={cancelledTotalPages}
            totalItems={cancelledTotal}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            updateQueryParams={true}
            emptyTitle={t("empty_title")}
            emptyDescription={t("empty_description")}
            showActions={false}
          />
        )}
      </div>
    </div>
  );
}
