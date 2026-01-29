"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PageFilters from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import {
  useComponentRegistry,
  useCreateComponentRegistry,
  useDeleteComponentRegistry,
} from "@/api/hooks/use-component-registry";
import { ComponentRegistryEntry } from "@/api/types/component-registry";
import { ComponentRegistryModal } from "./components/component-registry-modal";
import { useSnackbar } from "@/providers/snackbar-provider";

export default function DutyUzelPage() {
  const t = useTranslations("DutyUzelPage");
  const params = useParams();
  const searchParams = useSearchParams();
  const { updateQuery } = useFilterParams();
  const { showSuccess, showError } = useSnackbar();

  const depoId = params.depoId as string;
  const organizationId = depoId ? Number(depoId) : undefined;

  // Get query params
  const { q, page, pageSize } = Object.fromEntries(searchParams.entries());

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  });

  const createEntryMutation = useCreateComponentRegistry();
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

  // Handle create
  const handleCreate = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Handle save
  const handleSave = useCallback(
    (payload: any) => {
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
    },
    [createEntryMutation, showSuccess, showError, t]
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

  // Table columns
  const columns: TableColumn<ComponentRegistryEntry>[] = useMemo(
    () => [
      {
        key: "created_time",
        header: t("columns.created_time"),
        accessor: (row) => formatDate(row.created_time),
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
        accessor: (row) => row.locomotive,
      },
      {
        key: "loc_model_name",
        header: t("columns.loc_model_name"),
        accessor: (row) => row.loc_model_name,
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
        key: "defect_date",
        header: t("columns.defect_date"),
        accessor: (row) => formatDate(row.defect_date),
      },
      {
        key: "removed_manufacture_year",
        header: t("columns.removed_manufacture_year"),
        accessor: (row) => row.removed_manufacture_year,
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
      {
        key: "removed_manufacture_factory",
        header: t("columns.removed_manufacture_factory"),
        accessor: (row) => row.removed_manufacture_factory,
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
      />

      <div className="mt-4">
        <PageFilters
          filters={[]}
          hasSearch={true}
          searchPlaceholder={t("search_placeholder")}
          addButtonText={t("add_button")}
          addButtonPermittion="create_duty_uzel_report"
          onAdd={handleCreate}
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
          onDelete={handleDelete}
          isDeleting={deleteEntryMutation.isPending}
          emptyTitle={t("empty_title")}
          emptyDescription={t("empty_description")}
        />
      </div>

      <ComponentRegistryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        organizationId={organizationId}
        isPending={createEntryMutation.isPending}
      />
    </>
  );
}
