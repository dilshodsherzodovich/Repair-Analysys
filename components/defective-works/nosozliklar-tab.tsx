"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PaginatedTable, type TableColumn } from "@/ui/paginated-table";
import PageFilters from "@/ui/filters";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import { Badge } from "@/ui/badge";
import {
  DefectiveWorkEntry,
  DefectiveWorkCreatePayload,
  DefectiveWorkUpdatePayload,
} from "@/api/types/defective-works";
import {
  useCreateDefectiveWork,
  useDefectiveWorks,
  useDeleteDefectiveWork,
  useUpdateDefectiveWork,
} from "@/api/hooks/use-defective-works";
import { DefectiveWorkModal } from "@/components/defective-works/defective-work-modal";
import { useSnackbar } from "@/providers/snackbar-provider";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useOrganizations } from "@/api/hooks/use-organizations";

export function NosozliklarTab() {
  const t = useTranslations("NosozliklarTab");
  const { getAllQueryValues } = useFilterParams();
  const { updateQuery } = useFilterParams();
  const {
    q,
    page,
    pageSize,
    tab,
    organization_id,
    inspection_type,
    locomotive,
  } = getAllQueryValues();
  const { showSuccess, showError } = useSnackbar();

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEntry, setSelectedEntry] = useState<DefectiveWorkEntry | null>(
    null
  );

  const createMutation = useCreateDefectiveWork();
  const updateMutation = useUpdateDefectiveWork();
  const deleteMutation = useDeleteDefectiveWork();

  // Fetch filter options
  const { data: locomotivesData, isLoading: isLoadingLocomotives } =
    useGetLocomotives();
  const { data: inspectionTypesData, isLoading: isLoadingInspectionTypes } =
    useGetInspectionTypes();
  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 25;

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useDefectiveWorks({
    page: currentPage,
    page_size: itemsPerPage,
    search: q,
    tab: tab && tab !== "all" ? tab : undefined,
    organization_id: organization_id || undefined,
    inspection_type: inspection_type || undefined,
    locomotive: locomotive || undefined,
  });

  const paginatedData = apiResponse?.results ?? [];
  const totalItems = apiResponse?.count ?? 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;

  const error =
    apiError instanceof Error
      ? apiError
      : apiError
      ? new Error(apiError?.message || t("errors.generic"))
      : null;

  const handleEdit = useCallback((row: DefectiveWorkEntry) => {
    setSelectedEntry(row);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (row: DefectiveWorkEntry) => {
      try {
        await deleteMutation.mutateAsync(row.id);
        showSuccess(t("messages.delete_success"));
      } catch (error: any) {
        showError(
          t("errors.generic"),
          error?.response?.data?.message ||
            error?.message ||
            t("errors.delete")
        );
        throw error;
      }
    },
    [deleteMutation, showError, showSuccess, t]
  );

  const handleCreate = useCallback(() => {
    setSelectedEntry(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(
    (payload: DefectiveWorkCreatePayload | DefectiveWorkUpdatePayload) => {
      if (modalMode === "create") {
        createMutation.mutate(payload as DefectiveWorkCreatePayload, {
          onSuccess: () => {
            showSuccess(t("messages.create_success"));
            setIsModalOpen(false);
            setSelectedEntry(null);
          },
          onError: (error: any) => {
            showError(
              t("errors.generic"),
              error?.response?.data?.message ||
                error?.message ||
                t("errors.create")
            );
          },
        });
      } else if (selectedEntry) {
        updateMutation.mutate(
          {
            id: selectedEntry.id,
            payload: payload as DefectiveWorkUpdatePayload,
          },
          {
            onSuccess: () => {
              showSuccess(t("messages.update_success"));
              setIsModalOpen(false);
              setSelectedEntry(null);
            },
            onError: (error: any) => {
              showError(
                t("errors.generic"),
                error?.response?.data?.message ||
                  error?.message ||
                  t("errors.update")
              );
            },
          }
        );
      }
    },
    [
      modalMode,
      selectedEntry,
      createMutation,
      updateMutation,
      showSuccess,
      showError,
      t,
    ]
  );

  const formatDate = useCallback(
    (dateString: string, isTime: boolean = true) => {
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return isTime
          ? `${day}.${month}.${year} ${hours}:${minutes}`
          : `${day}.${month}.${year}`;
      } catch {
        return dateString;
      }
    },
    []
  );

  const columns: TableColumn<DefectiveWorkEntry>[] = [
    {
      key: "date",
      header: t("columns.date"),
      accessor: (row) => (row?.date ? formatDate(row.date) : ""),
    },
    {
      key: "organization_info",
      header: t("columns.organization"),
      accessor: (row) => row.organization_info?.name,
    },
    {
      key: "locomotive_info",
      header: t("columns.locomotive"),
      accessor: (row) =>
        `${row.locomotive_info?.name} (${row.locomotive_info?.locomotive_model})`,
    },
    {
      key: "inspection_type_info",
      header: t("columns.inspection_type"),
      accessor: (row) =>
        `${row.inspection_type_info?.name || "-"} (${
          row.inspection_type_info?.inspection_type || "-"
        })`,
    },
    {
      key: "train_driver",
      header: t("columns.train_driver"),
      accessor: (row) => row?.train_driver,
    },
    {
      key: "code",
      header: t("columns.code"),
      accessor: (row) => row?.code,
    },
    {
      key: "issue",
      header: t("columns.issue"),
      accessor: (row) => (
        <div className="max-w-[400px] whitespace-pre-wrap break-words">
          {row?.issue}
        </div>
      ),
    },
    {
      key: "table_number",
      header: t("columns.table_number"),
      accessor: (row) => row?.table_number,
    },
    {
      key: "status",
      header: t("columns.status"),
      accessor: (row) => {
        const isDone = !!row?.table_number;
        return (
          <Badge variant={isDone ? "success" : "destructive"}>
            {isDone ? t("status_done") : t("status_not_done")}
          </Badge>
        );
      },
    },
  ];

  const locomotiveOptions = useMemo(() => {
    const options = [{ value: "", label: t("options.all_locomotives") }];
    if (locomotivesData && Array.isArray(locomotivesData?.results)) {
      locomotivesData?.results?.forEach((loc) =>
        options.push({
          value: loc.id.toString(),
          label: loc.name || loc.model_name || `Lokomotiv ${loc.id}`,
        })
      );
    }
    return options;
  }, [locomotivesData, t]);

  const inspectionTypeOptions = useMemo(() => {
    const options = [{ value: "", label: t("options.all_inspection_types") }];
    if (inspectionTypesData && Array.isArray(inspectionTypesData)) {
      inspectionTypesData.forEach((it) =>
        options.push({
          value: it.id.toString(),
          label: it.name || it.name_uz || it.name_ru || `Tekshiruv ${it.id}`,
        })
      );
    }
    return options;
  }, [inspectionTypesData, t]);

  const organizationOptions = useMemo(() => {
    const options = [{ value: "", label: t("options.all_organizations") }];
    if (organizationsData && Array.isArray(organizationsData)) {
      organizationsData.forEach((org) =>
        options.push({
          value: org.id.toString(),
          label: org.name || `Tashkilot ${org.id}`,
        })
      );
    }
    return options;
  }, [organizationsData, t]);

  const statusOptions = useMemo(() => {
    return [
      { value: "", label: t("options.all_records") },
      { value: "done", label: t("status_done") },
      { value: "not_done", label: t("status_not_done") },
    ];
  }, [t]);

  return (
    <>
      <div className="px-6 py-4">
        <PageFilters
          filters={[
            {
              name: "tab",
              label: t("filters.status"),
              isSelect: true,
              options: statusOptions,
              placeholder: t("filters.status_placeholder"),
              searchable: false,
            },
            {
              name: "organization_id",
              label: t("filters.organization"),
              isSelect: true,
              options: organizationOptions,
              placeholder: t("filters.organization_placeholder"),
              searchable: false,
              loading: isLoadingOrganizations,
            },
            {
              name: "inspection_type",
              label: t("filters.inspection_type"),
              isSelect: true,
              options: inspectionTypeOptions,
              placeholder: t("filters.inspection_type_placeholder"),
              searchable: false,
              loading: isLoadingInspectionTypes,
            },
            {
              name: "locomotive",
              label: t("filters.locomotive"),
              isSelect: true,
              options: locomotiveOptions,
              placeholder: t("filters.locomotive_placeholder"),
              searchable: false,
              loading: isLoadingLocomotives,
            },
          ]}
          hasSearch
          searchPlaceholder={t("search_placeholder")}
          addButtonPermittion="create_defective_work"
          onAdd={handleCreate}
          className="!mb-0"
        />
      </div>

      <div className="px-6 pb-6">
        <PaginatedTable
          columns={columns}
          data={paginatedData}
          getRowId={(row) => row.id}
          itemsPerPage={25}
          size="xs"
          rowClassName={(row) =>
            formatDate(new Date(row.date).toISOString(), false) ===
            formatDate(new Date().toISOString(), false)
              ? "bg-emerald-50 hover:bg-emerald-100 [&>td]:bg-emerald-50 [&>td]:group-hover:bg-emerald-100"
              : !row?.table_number
              ? "bg-red-50 hover:bg-red-100 [&>td]:bg-red-50 [&>td]:group-hover:bg-red-100"
              : ""
          }
          isLoading={isLoading}
          error={error}
          totalPages={totalPages}
          totalItems={totalItems}
          updateQueryParams
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyTitle={t("empty_title")}
          emptyDescription={t("empty_description")}
          deletePermission="delete_defective_work"
          editPermission="edit_defective_work"
        />
      </div>

      <DefectiveWorkModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSave}
        entry={selectedEntry}
        mode={modalMode}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}

