"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PageFilters from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import { List, LayoutList } from "lucide-react";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import {
  useComponentRegistry,
  useComponentGroupOverview,
  useCreateComponentRegistry,
  useUpdateComponentRegistry,
  useDeleteComponentRegistry,
} from "@/api/hooks/use-component-registry";
import { ComponentRegistryEntry } from "@/api/types/component-registry";
import { componentRegistryService } from "@/api/services/component-registry.service";
import { ComponentRegistryModal } from "./components/component-registry-modal";
import { ComponentGroupAccordion } from "./components/component-group-accordion";
import {
  exportComponentGroupOverviewExcel,
  exportComponentRegistryListExcel,
} from "@/utils/duty-uzel-excel-export";
import { useSnackbar } from "@/providers/snackbar-provider";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";

export default function DutyUzelPage() {
  const t = useTranslations("DutyUzelPage");
  const params = useParams();
  const searchParams = useSearchParams();
  const { updateQuery } = useFilterParams();
  const { showSuccess, showError } = useSnackbar();

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  if (!currentUser || !canAccessSection(currentUser, "duty_uzel")) {
    return <UnauthorizedPage />;
  }

  const depoId = params.depoId as string;
  const organizationId = depoId ? Number(depoId) : undefined;

  // Get query params
  const { q, page, pageSize } = Object.fromEntries(searchParams.entries());
  const defectDateStart = searchParams.get("defect_date_start") || undefined;
  const defectDateEnd = searchParams.get("defect_date_end") || undefined;

  // "list" (classic table) vs "group" (grouped by component group)
  const isGroupView = searchParams.get("view") === "group";

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ComponentRegistryEntry | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  // Get current page and items per page from query params
  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useComponentRegistry({
    page: currentPage,
    page_size: itemsPerPage,
    search: q,
    organization: organizationId,
    defect_date_start: defectDateStart,
    defect_date_end: defectDateEnd,
  }, !isGroupView);

  const {
    data: groupOverview,
    isLoading: isLoadingGroupOverview,
    error: groupApiError,
  } = useComponentGroupOverview(
    { start_date: defectDateStart, end_date: defectDateEnd },
    isGroupView
  );

  const createEntryMutation = useCreateComponentRegistry();
  const updateEntryMutation = useUpdateComponentRegistry();
  const deleteEntryMutation = useDeleteComponentRegistry();

  const paginatedData = apiResponse?.results ?? [];
  const totalItems = apiResponse?.count ?? 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;
  const error = apiError
    ? apiError instanceof Error
      ? apiError
      : new Error(
          (apiError as any)?.message || t("error_load")
        )
    : null;

  const groupError = useMemo(() => {
    if (!groupApiError) return null;
    const data = (groupApiError as any)?.response?.data;
    return data?.detail || (groupApiError as Error)?.message || t("error_load");
  }, [groupApiError, t]);

  // Switch between the classic table and the by-group view
  const handleViewChange = useCallback(
    (value: string) => {
      updateQuery({ view: value === "group" ? "group" : null });
    },
    [updateQuery]
  );

  // Handle create
  const handleCreate = useCallback(() => {
    setEditEntry(undefined);
    setIsModalOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((row: ComponentRegistryEntry) => {
    setEditEntry(row);
    setIsModalOpen(true);
  }, []);

  // Handle save (create or update)
  const handleSave = useCallback(
    (payload: any) => {
      if (editEntry) {
        updateEntryMutation.mutate(
          { id: editEntry.id, payload },
          {
            onSuccess: () => {
              showSuccess(t("success_update"));
              setIsModalOpen(false);
              setEditEntry(undefined);
            },
            onError: (error: any) => {
              showError(
                t("error_title"),
                error?.response?.data?.message ||
                  error?.message ||
                  t("error_update")
              );
            },
          }
        );
      } else {
        createEntryMutation.mutate(payload, {
          onSuccess: () => {
            showSuccess(t("success_create"));
            setIsModalOpen(false);
          },
          onError: (error: any) => {
            showError(
              t("error_title"),
              error?.response?.data?.message ||
                error?.message ||
                t("error_create")
            );
          },
        });
      }
    },
    [editEntry, createEntryMutation, updateEntryMutation, showSuccess, showError, t]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (row: ComponentRegistryEntry) => {
      try {
        await deleteEntryMutation.mutateAsync(row.id);
        showSuccess(t("success_delete"));
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("error_delete");
        showError(t("error_title"), message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [deleteEntryMutation, showSuccess, showError, t]
  );

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditEntry(undefined);
  }, []);

  // Format date helper
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateString;
    }
  };

  // Excel export of the group view: the counts shown on screen, group by group
  const handleGroupExport = useCallback(async () => {
    if (!groupOverview) return;
    setIsExporting(true);
    try {
      await exportComponentGroupOverviewExcel(groupOverview, {
        t,
        startDate: defectDateStart,
        endDate: defectDateEnd,
      });
    } catch (err) {
      showError(
        t("error_title"),
        err instanceof Error ? err.message : t("error_load")
      );
    } finally {
      setIsExporting(false);
    }
  }, [groupOverview, defectDateStart, defectDateEnd, showError, t]);

  // Handle excel export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const allData = await componentRegistryService.getRegistry({
        no_page: true,
        search: q,
        organization: organizationId,
        defect_date_start: defectDateStart,
        defect_date_end: defectDateEnd,
      });
      const rows = ((allData as any).results ??
        allData) as ComponentRegistryEntry[];
      await exportComponentRegistryListExcel(rows, {
        t,
        startDate: defectDateStart,
        endDate: defectDateEnd,
      });
    } catch (err) {
      showError(
        t("error_title"),
        err instanceof Error ? err.message : t("error_load")
      );
    } finally {
      setIsExporting(false);
    }
  }, [q, organizationId, defectDateStart, defectDateEnd, showError, t]);

  // Table columns
  const columns: TableColumn<ComponentRegistryEntry>[] = useMemo(
    () => [
      {
        key: "defect_date",
        header: t("columns.defect_date"),
        accessor: (row) => formatDate(row.defect_date),
      },
      {
        key: "organization",
        header: t("columns.organization"),
        accessor: (row) => row.organization,
      },
      {
        key: "inspection",
        header: t("columns.inspection"),
        accessor: (row) => row.inspection,
      },
      {
        key: "locomotive",
        header: t("columns.locomotive"),
        accessor: (row) => <span>{row.locomotive}-{row.loc_model_name || ""}</span>,
      },
      {
        key: "component",
        header: t("columns.component"),
        accessor: (row) => row.component,
      },
      {
        key: "section",
        header: t("columns.section"),
        accessor: (row) => row.section || "—",
      },
      {
        key: "reason",
        header: t("columns.reason"),
        accessor: (row) => (
          <div className="max-w-[300px]">
            <div className="whitespace-normal break-words">{row.reason}</div>
          </div>
        ),
      },
      {
        key: "removed_manufacture_year",
        header: t("columns.removed_manufacture_year"),
        accessor: (row) => row.removed_manufacture_year,
      },
      {
        key: "removed_manufacture_factory",
        header: t("columns.removed_manufacture_factory"),
        accessor: (row) => row.removed_manufacture_factory,
      },
      {
        key: "installed_manufacture_year",
        header: t("columns.installed_manufacture_year"),
        accessor: (row) => row.installed_manufacture_year,
      },
      {
        key: "installed_manufacture_factory",
        header: t("columns.installed_manufacture_factory"),
        accessor: (row) => row.installed_manufacture_factory,
      },
    ],
    [t]
  );

  if (!organizationId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("depo_id_not_found")}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Tabs
            value={isGroupView ? "group" : "list"}
            onValueChange={handleViewChange}
            className="w-auto"
          >
            <TabsList className="bg-white border border-[#CAD5E2] p-1 rounded-lg">
              <TabsTrigger
                value="list"
                className="px-3 py-1.5 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <List className="h-4 w-4" />
                {t("view_list")}
              </TabsTrigger>
              <TabsTrigger
                value="group"
                className="px-3 py-1.5 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <LayoutList className="h-4 w-4" />
                {t("view_group")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {isGroupView ? (
        <>
          <div className="mt-4">
            <PageFilters
              filters={[]}
              hasSearch={false}
              hasDateRangePicker={true}
              dateRangeStartKey="defect_date_start"
              dateRangeEndKey="defect_date_end"
              dateRangePickerLabel={t("columns.defect_date")}
              onExport={groupOverview ? handleGroupExport : undefined}
              exportLoading={isExporting}
            />
          </div>

          {groupError && (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {groupError}
            </div>
          )}

          <div className="mt-6">
            <ComponentGroupAccordion
              data={groupOverview}
              isLoading={isLoadingGroupOverview}
              depoId={depoId}
              startDate={defectDateStart}
              endDate={defectDateEnd}
            />
          </div>
        </>
      ) : (
        <>
          <div className="mt-4">
            <PageFilters
              filters={[]}
              hasSearch={true}
              searchPlaceholder={t("search_placeholder")}
              hasDateRangePicker={true}
              dateRangeStartKey="defect_date_start"
              dateRangeEndKey="defect_date_end"
              dateRangePickerLabel={t("columns.defect_date")}
              addButtonText={t("add_button")}
              addButtonPermittion="create_duty_uzel_report"
              onAdd={handleCreate}
              onExport={handleExport}
              exportLoading={isExporting}
            />
          </div>

          <div className="mt-6">
            <PaginatedTable
              columns={columns}
              data={paginatedData}
              getRowId={(row) => row.id}
              isLoading={isLoading}
              error={error}
              totalPages={totalPages}
              totalItems={totalItems}
              updateQueryParams={true}
              showActions={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={deleteEntryMutation.isPending}
              emptyTitle={t("empty_title")}
              emptyDescription={t("empty_description")}
            />
          </div>
        </>
      )}

      <ComponentRegistryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        organizationId={organizationId}
        isPending={createEntryMutation.isPending || updateEntryMutation.isPending}
        editData={editEntry}
      />
    </>
  );
}
