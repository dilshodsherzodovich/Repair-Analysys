"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PageFilters from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { getPageCount } from "@/lib/utils";
import {
  useLocomotiveReplacementOils,
  useCreateLocomotiveReplacementOil,
  useUpdateLocomotiveReplacementOil,
  useDeleteLocomotiveReplacementOil,
} from "@/api/hooks/use-locomotive-replacement-oil";
import { LocomotiveReplacementOil } from "@/api/types/locomotive-replacement-oil";
import { ReplacementModal } from "./components/replacement-modal";
import { useSnackbar } from "@/providers/snackbar-provider";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";

export default function ReplacementSchedulePage() {
  const t = useTranslations("ReplacementSchedulePage");
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useSnackbar();

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  if (!currentUser || !canAccessSection(currentUser, "replacement_schedule")) {
    return <UnauthorizedPage />;
  }

  // Get query params
  const { q, page, pageSize } = Object.fromEntries(searchParams.entries());

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReplacement, setSelectedReplacement] =
    useState<LocomotiveReplacementOil | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Get current page and items per page from query params
  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
    refetch,
  } = useLocomotiveReplacementOils({
    page: currentPage,
    page_size: itemsPerPage,
    search: q,
  });

  const createReplacementMutation = useCreateLocomotiveReplacementOil();
  const updateReplacementMutation = useUpdateLocomotiveReplacementOil();
  const deleteReplacementMutation = useDeleteLocomotiveReplacementOil();

  const paginatedData = apiResponse?.results ?? [];
  const totalItems = apiResponse?.count ?? 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;
  const error = apiError
    ? apiError instanceof Error
      ? apiError
      : new Error((apiError as any)?.message || t("error_load"))
    : null;

  // Handle create
  const handleCreate = useCallback(() => {
    setSelectedReplacement(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((replacement: LocomotiveReplacementOil) => {
    setSelectedReplacement(replacement);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  // Handle save
  const handleSave = useCallback(
    (payload: any) => {
      if (modalMode === "edit" && selectedReplacement) {
        updateReplacementMutation.mutate(
          {
            id: selectedReplacement.id,
            payload,
          },
          {
            onSuccess: () => {
              showSuccess(t("success_update"));
              setIsModalOpen(false);
              setSelectedReplacement(null);
              refetch();
            },
            onError: (error: any) => {
              showError(
                t("error_title"),
                error?.response?.data?.message ||
                  error?.message ||
                  t("error_update"),
              );
            },
          }
        );
      } else {
        createReplacementMutation.mutate(payload, {
          onSuccess: () => {
            showSuccess(t("success_create"));
            setIsModalOpen(false);
            refetch();
          },
          onError: (error: any) => {
            showError(
              t("error_title"),
              error?.response?.data?.message ||
                error?.message ||
                t("error_create"),
            );
          },
        });
      }
    },
    [
      modalMode,
      selectedReplacement,
      createReplacementMutation,
      updateReplacementMutation,
      showSuccess,
      showError,
      refetch,
      t,
    ]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (row: LocomotiveReplacementOil) => {
      try {
        await deleteReplacementMutation.mutateAsync(row.id);
        showSuccess(t("success_delete"));
        refetch();
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("error_delete");
        showError(t("error_title"), message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [deleteReplacementMutation, showSuccess, showError, refetch, t],
  );

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedReplacement(null);
  }, []);

  // Format date helper
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateString;
    }
  };

  // Format number helper
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("uz-UZ").format(value);
  };

  // Table columns
  const columns: TableColumn<LocomotiveReplacementOil>[] = useMemo(
    () => [
      {
        key: "locomotive_name",
        header: t("columns.locomotive"),
        accessor: (row) => row.locomotive_name,
      },
      {
        key: "section_name",
        header: t("columns.section"),
        accessor: (row) => row.section_name,
      },
      {
        key: "maintenance_type_name",
        header: t("columns.maintenance_type"),
        accessor: (row) => row.maintenance_type_name,
      },
      {
        key: "lubricant_type_name",
        header: t("columns.lubricant_type"),
        accessor: (row) => row.lubricant_type_name,
      },
      {
        key: "service_date",
        header: t("columns.service_date"),
        accessor: (row) => formatDate(row.service_date),
      },
      {
        key: "consumption",
        header: t("columns.consumption"),
        accessor: (row) => formatNumber(row.consumption),
      },
    ],
    [t],
  );

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
          addButtonPermittion="create_locomotive_replacement_oil"
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteReplacementMutation.isPending}
          emptyTitle={t("empty_title")}
          emptyDescription={t("empty_description")}
          editPermission="edit_locomotive_replacement_oil"
          deletePermission="delete_locomotive_replacement_oil"
        />
      </div>

      <ReplacementModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        isPending={
          createReplacementMutation.isPending ||
          updateReplacementMutation.isPending
        }
        replacement={selectedReplacement}
        mode={modalMode}
      />
    </>
  );
}

