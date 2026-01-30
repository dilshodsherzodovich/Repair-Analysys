"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import PageFilters from "@/ui/filters";
import { getPageCount } from "@/lib/utils";
import { useInspections } from "@/api/hooks/use-inspections";
import { Inspection } from "@/api/types/inspections";
import { InspectionsGroupedTable } from "@/components/inspections/inspection-grouped-table";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
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
  const inspectionTypeParam = getQueryValue("inspection_type");
  const locomotiveTypeParam = getQueryValue("locomotive_type");
  const startDateParam = getQueryValue("start_date");
  const endDateParam = getQueryValue("end_date");
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();
  const { data: inspectionTypesData, isLoading: isLoadingInspectionTypes } =
    useGetInspectionTypes(true);

  const locomotiveTypeOptions = useMemo(
    () => [
      { label: t("filter_all"), value: "" },
      { label: t("locomotive_type_electric_loco"), value: "electric_loco" },
      { label: t("locomotive_type_diesel_loco"), value: "diesel_loco" },
      { label: t("locomotive_type_electric_train"), value: "electric_train" },
      { label: t("locomotive_type_high_speed"), value: "high_speed" },
    ],
    [t]
  );

  const inspectionTypesList = Array.isArray(inspectionTypesData)
    ? inspectionTypesData
    : (inspectionTypesData as unknown as { results?: { id: number; name: string }[] } | undefined)
        ?.results ?? [];

  const pageFilters = useMemo(
    () => [
      {
        name: "inspection_type",
        label: t("filter_inspection_type"),
        isSelect: true,
        options: [
          { label: t("filter_all"), value: "" },
          ...inspectionTypesList.map((type) => ({
            label: type.name,
            value: String(type.id),
          })),
        ],
        placeholder: t("filter_all"),
        searchable: true,
        clearable: true,
        loading: isLoadingInspectionTypes,
      },
      {
        name: "locomotive_type",
        label: t("filter_locomotive_type"),
        isSelect: true,
        options: locomotiveTypeOptions,
        placeholder: t("filter_all"),
        searchable: true,
        clearable: true,
      },
      {
        name: "organization",
        label: t("filter_organization"),
        isSelect: true,
        options: [
          { label: t("filter_all"), value: "" },
          ...(organizationsData ?? []).map((org) => ({
            label: org.name,
            value: String(org.id),
          })),
        ],
        placeholder: t("filter_all"),
        searchable: true,
        clearable: true,
        loading: isLoadingOrganizations,
      },
    ],
    [
      inspectionTypesList,
      organizationsData,
      locomotiveTypeOptions,
      isLoadingInspectionTypes,
      isLoadingOrganizations,
      t,
    ]
  );

  const isInProgress = tab === "in_progress";
  const isArchive = tab === "archive";
  const isCancelled = tab === "cancelled";

  const inProgressParams = useMemo(
    () => ({
      is_closed: false,
      no_page: true,
      organization: organizationParam ? Number(organizationParam) : undefined,
      inspection_type: inspectionTypeParam
        ? Number(inspectionTypeParam)
        : undefined,
      locomotive_type: locomotiveTypeParam || undefined,
    }),
    [organizationParam, inspectionTypeParam, locomotiveTypeParam]
  );

  const archiveParams = useMemo(
    () => ({
      is_closed: true,
      is_cancelled: false,
      page: currentPage,
      page_size: itemsPerPage,
      organization: organizationParam ? Number(organizationParam) : undefined,
      inspection_type: inspectionTypeParam
        ? Number(inspectionTypeParam)
        : undefined,
      locomotive_type: locomotiveTypeParam || undefined,
      search: q || undefined,
      start_date: startDateParam || undefined,
      end_date: endDateParam || undefined,
    }),
    [
      currentPage,
      itemsPerPage,
      organizationParam,
      inspectionTypeParam,
      locomotiveTypeParam,
      q,
      startDateParam,
      endDateParam,
    ]
  );

  const cancelledParams = useMemo(
    () => ({
      is_cancelled: true,
      page: currentPage,
      page_size: itemsPerPage,
      organization: organizationParam ? Number(organizationParam) : undefined,
      inspection_type: inspectionTypeParam
        ? Number(inspectionTypeParam)
        : undefined,
      locomotive_type: locomotiveTypeParam || undefined,
    }),
    [
      currentPage,
      itemsPerPage,
      organizationParam,
      inspectionTypeParam,
      locomotiveTypeParam,
    ]
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

  type InspectionWithIndex = Inspection & { __displayIndex: number };
  const archiveListWithIndex: InspectionWithIndex[] = useMemo(
    () =>
      archiveList.map((row, i) => ({
        ...row,
        __displayIndex: (currentPage - 1) * itemsPerPage + i + 1,
      })),
    [archiveList, currentPage, itemsPerPage]
  );
  const cancelledListWithIndex: InspectionWithIndex[] = useMemo(
    () =>
      cancelledList.map((row, i) => ({
        ...row,
        __displayIndex: (currentPage - 1) * itemsPerPage + i + 1,
      })),
    [cancelledList, currentPage, itemsPerPage]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      updateQuery({ tab: value, page: "1" });
    },
    [updateQuery]
  );

  const columns: TableColumn<InspectionWithIndex>[] = useMemo(
    () => [
      {
        key: "no",
        header: t("columns.no"),
        accessor: (row) => row.__displayIndex,
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
     
      />

      <div className="px-6 space-y-4">
        <div className="mb-6 bg-white border border-[#CAD5E2] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <PageFilters
          filters={pageFilters}
          hasSearch={isArchive}
          hasDateRangePicker={isArchive}
          searchPlaceholder={t("search_placeholder")}
          dateRangePickerLabel={t("filter_date_range")}
          className="mb-0 flex-1 min-w-0"
        />
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="bg-white border border-gray-200 p-1 gap-2 rounded-md inline-flex">
              <TabsTrigger
                value="in_progress"
                className="px-3 py-2 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:hover:border-gray-300 flex items-center gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                {t("tab_in_progress")}
              </TabsTrigger>
              <TabsTrigger
                value="archive"
                className="px-3 py-2 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:hover:border-gray-300"
              >
                {t("tab_archive")}
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="px-3 py-2 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:hover:border-gray-300"
              >
                {t("tab_cancelled")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
         
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
          <PaginatedTable<InspectionWithIndex>
            columns={columns}
            data={archiveListWithIndex}
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
            size="md"
          />
        )}

        {isCancelled && (
          <PaginatedTable<InspectionWithIndex>
            columns={columns}
            data={cancelledListWithIndex}
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
            size="md"
          />
        )}
      </div>
    </div>
  );
}
