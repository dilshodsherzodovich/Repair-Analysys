"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Gauge, Train } from "lucide-react";
import PageFilters from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { getPageCount } from "@/lib/utils";
import {
  useLocomotivePassportInspections,
  useCreateLocomotivePassportInspection,
  useUpdateLocomotivePassportInspection,
  useDeleteLocomotivePassportInspection,
} from "@/api/hooks/use-locomotive-passport-inspections";
import { LocomotivePassportInspection } from "@/api/types/locomotive-passport-inspections";
import { PassportInspectionModal } from "./components/passport-inspection-modal";
import { useSnackbar } from "@/providers/snackbar-provider";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";

export default function LocomotivePassportInspectionsPage() {
  const t = useTranslations("LocomotivePassportInspectionsPage");
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useSnackbar();

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  if (
    !currentUser ||
    !canAccessSection(currentUser, "locomotive_passport_inspections")
  ) {
    return <UnauthorizedPage />;
  }

  // Get query params
  const { q, page, pageSize } = Object.fromEntries(searchParams.entries());

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] =
    useState<LocomotivePassportInspection | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Get current page and items per page from query params
  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useLocomotivePassportInspections({
    page: currentPage,
    page_size: itemsPerPage,
    search: q,
  });

  const createInspectionMutation = useCreateLocomotivePassportInspection();
  const updateInspectionMutation = useUpdateLocomotivePassportInspection();
  const deleteInspectionMutation = useDeleteLocomotivePassportInspection();

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
    setSelectedInspection(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((inspection: LocomotivePassportInspection) => {
    setSelectedInspection(inspection);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  // Handle save
  const handleSave = useCallback(
    (payload: any) => {
      if (modalMode === "edit" && selectedInspection) {
        updateInspectionMutation.mutate(
          {
            id: selectedInspection.id,
            payload,
          },
          {
            onSuccess: () => {
              showSuccess(t("success_update"));
              setIsModalOpen(false);
              setSelectedInspection(null);
            },
            onError: (error: any) => {
              showError(
                t("error_title"),
                error?.response?.data?.message ||
                  error?.message ||
                  t("error_update"),
              );
            },
          },
        );
      } else {
        createInspectionMutation.mutate(payload, {
          onSuccess: () => {
            showSuccess(t("success_create"));
            setIsModalOpen(false);
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
      selectedInspection,
      createInspectionMutation,
      updateInspectionMutation,
      showSuccess,
      showError,
      t,
    ],
  );

  // Handle delete
  const handleDelete = useCallback(
    async (row: LocomotivePassportInspection) => {
      try {
        await deleteInspectionMutation.mutateAsync(row.id);
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
    [deleteInspectionMutation, showSuccess, showError, t],
  );

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedInspection(null);
  }, []);

  // Format date helper
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "—";
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

  // Format number helper
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "—";
    return value.toLocaleString();
  };

  // Simple inspection field component
  const InspectionField = ({
    date,
    km,
  }: {
    date: string | null;
    km: number | null | undefined;
  }) => {
    const hasDate = !!date;
    const hasKm = km !== null && km !== undefined;

    if (!hasDate && !hasKm) {
      return <span className="text-gray-400">—</span>;
    }

    return (
      <div className="space-y-1.5">
        {hasDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-sm text-gray-900">{formatDate(date)}</span>
          </div>
        )}
        {hasKm && (
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-sm text-gray-900">{formatNumber(km)}</span>
          </div>
        )}
      </div>
    );
  };

  // Table columns
  const columns: TableColumn<LocomotivePassportInspection>[] = useMemo(
    () => [
      {
        key: "locomotive_name",
        header: t("columns.locomotive"),
        accessor: (row) => {
          return (
            <div className="flex items-center gap-2">
              <Train className="h-4 w-4 text-gray-600" />
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 text-sm">
                  {row.locomotive_name + " - " + row.locomotive_model}
                </span>
              </div>
            </div>
          );
        },
        className: "min-w-[200px]",
      },
      {
        key: "section_name",
        header: t("columns.section"),
        accessor: (row) => (
          <span className="text-sm text-gray-700">{row.section_name}</span>
        ),
      },
      {
        key: "buksa_bearing",
        header: t("columns.buksa_bearing"),
        accessor: (row) => (
          <InspectionField
            date={row.buksa_bearing_date}
            km={row.buksa_bearing_km}
          />
        ),
      },
      {
        key: "ted_bearing",
        header: t("columns.ted_bearing"),
        accessor: (row) => (
          <InspectionField
            date={row.ted_bearing_date}
            km={row.ted_bearing_km}
          />
        ),
      },
      {
        key: "compressor_oil",
        header: t("columns.compressor_oil"),
        accessor: (row) => (
          <InspectionField
            date={row.compressor_oil_date}
            km={row.compressor_oil_km}
          />
        ),
      },
      {
        key: "air_filter",
        header: t("columns.air_filter"),
        accessor: (row) => (
          <InspectionField date={row.air_filter_date} km={row.air_filter_km} />
        ),
      },
      {
        key: "oil_filter",
        header: t("columns.oil_filter"),
        accessor: (row) => (
          <InspectionField date={row.oil_filter_date} km={row.oil_filter_km} />
        ),
      },
      {
        key: "lubrication",
        header: t("columns.lubrication"),
        accessor: (row) => (
          <InspectionField
            date={row.lubrication_date}
            km={row.lubrication_km}
          />
        ),
      },
      {
        key: "kozh_oil",
        header: t("columns.kozh_oil"),
        accessor: (row) => (
          <InspectionField date={row.kozh_oil_date} km={row.kozh_oil_km} />
        ),
      },
      {
        key: "brake_rti",
        header: t("columns.brake_rti"),
        accessor: (row) => (
          <InspectionField date={row.brake_rti_date} km={row.brake_rti_km} />
        ),
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
          addButtonPermittion="create_locomotive_passport_inspection"
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
          isDeleting={deleteInspectionMutation.isPending}
          emptyTitle={t("empty_title")}
          emptyDescription={t("empty_description")}
          editPermission="edit_locomotive_passport_inspection"
          deletePermission="delete_locomotive_passport_inspection"
        />
      </div>

      <PassportInspectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        isPending={
          createInspectionMutation.isPending ||
          updateInspectionMutation.isPending
        }
        inspection={selectedInspection}
        mode={modalMode}
      />
    </>
  );
}
