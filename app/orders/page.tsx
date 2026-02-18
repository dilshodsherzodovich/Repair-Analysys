"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import PageFilters from "@/ui/filters";
import { FileSpreadsheet, CheckCircle } from "lucide-react";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import {
  OrderData,
  CreateOrderPayload,
  UpdateOrderPayload,
} from "@/api/types/orders";
import {
  useOrders,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useConfirmOrder,
} from "@/api/hooks/use-orders";
import { OrderModal } from "@/components/orders/order-modal";
import { useSnackbar } from "@/providers/snackbar-provider";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { truncateFilename } from "@/utils/format-filename";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { hasPermission, type Permission } from "@/lib/permissions";
import { Badge } from "@/ui/badge";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import { responsibleOrganizations } from "@/data";

export default function OrdersPage() {
  const t = useTranslations("OrdersPage");
  const { updateQuery, getAllQueryValues } = useFilterParams();

  const journalTypeLabels: Record<string, string> = useMemo(
    () => ({
      mpr: t("journal_types.mpr"),
      invalid: t("journal_types.invalid"),
      defect: t("journal_types.defect"),
    }),
    [t]
  );

  const journalTypeOptions = useMemo(
    () => [
      { value: "", label: t("options.all_journal_types") },
      { value: "mpr", label: t("journal_types.mpr") },
      { value: "invalid", label: t("journal_types.invalid") },
      { value: "defect", label: t("journal_types.defect") },
    ],
    [t]
  );

  const {
    q,
    page,
    pageSize,
    tab,
    type_of_journal,
    locomotive,
    date,
    organization,
    responsible_department,
  } = getAllQueryValues();

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState<OrderData | null>(null);
  const { showSuccess, showError } = useSnackbar();
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();
  const confirmOrderMutation = useConfirmOrder();

  const { data: locomotivesData, isLoading: isLoadingLocomotives } =
    useGetLocomotives();

  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  if (!currentUser || !canAccessSection(currentUser, "orders")) {
    return <UnauthorizedPage />;
  }

  const canChooseOrganization = hasPermission(
    currentUser,
    "choose_organization"
  );

  // Check if user is admin (admin doesn't have create/edit/delete permissions)
  const isAdmin =
    !hasPermission(currentUser, "create_order") &&
    !hasPermission(currentUser, "edit_order") &&
    !hasPermission(currentUser, "delete_order");

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const locomotiveOptions = useMemo(() => {
    const options = [{ value: "", label: t("options.all_locomotives") }];
    if (locomotivesData && Array.isArray(locomotivesData?.results)) {
      locomotivesData?.results?.forEach(
        (locomotive: { id: number; name?: string; model_name?: string }) => {
          options.push({
            value: locomotive.name || "",
            label:
              locomotive.name ||
              locomotive.model_name ||
              `Lokomotiv ${locomotive.id}`,
          });
        }
      );
    }
    return options;
  }, [locomotivesData, t]);

  const organizationOptions = useMemo(() => {
    const options = [{ value: "", label: t("options.all_organizations") }];
    if (canChooseOrganization && organizationsData) {
      organizationsData?.forEach((org) => {
        options.push({
          value: org.id.toString(),
          label: org.name || `Tashkilot ${org.id}`,
        });
      });
    }
    return options;
  }, [organizationsData, canChooseOrganization, t]);

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useOrders({
    page: currentPage,
    page_size: itemsPerPage,
    search: q || responsible_department ||  locomotive || organization,
    type_of_journal : type_of_journal || undefined,
    date: date || undefined,
    // organization: organization || undefined,
  });

  const paginatedData = apiResponse?.results || [];
  const totalItems = apiResponse?.count || 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;

  const error = apiError
    ? apiError instanceof Error
      ? apiError
      : new Error(apiError.message || t("errors.load"))
    : null;

  const handleEdit = (row: OrderData) => {
    setSelectedOrder(row);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDelete = useCallback(
    async (row: OrderData) => {
      try {
        await deleteOrderMutation.mutateAsync(row.id);
        showSuccess(t("messages.delete_success"));
      } catch (error: any) {
        showError(
          t("errors.generic"),
          error?.response?.data?.message ||
            error.message ||
            t("errors.delete")
        );
        throw error;
      }
    },
    [deleteOrderMutation, showError, showSuccess, t]
  );

  const handleConfirmClick = useCallback((row: OrderData) => {
    setOrderToConfirm(row);
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmOrder = useCallback(async () => {
    if (!orderToConfirm) return;
    try {
      await confirmOrderMutation.mutateAsync(orderToConfirm.id);
      showSuccess(t("messages.confirm_success"));
      setIsConfirmModalOpen(false);
      setOrderToConfirm(null);
    } catch (error: any) {
      showError(
        t("errors.generic"),
        error?.response?.data?.message ||
          error.message ||
          t("errors.confirm")
      );
      throw error;
    }
  }, [orderToConfirm, confirmOrderMutation, showError, showSuccess, t]);

  const handleCreate = () => {
    setSelectedOrder(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleSave = (orderData: CreateOrderPayload | UpdateOrderPayload) => {
    if (modalMode === "create") {
      createOrderMutation.mutate(orderData as CreateOrderPayload, {
        onSuccess: () => {
          showSuccess(t("messages.create_success"));
          setIsModalOpen(false);
          setSelectedOrder(null);
        },
        onError: (error: any) => {
          showError(
            t("errors.generic"),
            error?.response?.data?.message ||
              error.message ||
              t("errors.create")
          );
        },
      });
    } else {
      if (selectedOrder) {
        updateOrderMutation.mutate(
          {
            id: selectedOrder.id,
            orderData: orderData as UpdateOrderPayload,
          },
          {
            onSuccess: () => {
              showSuccess(t("messages.update_success"));
              setIsModalOpen(false);
              setSelectedOrder(null);
            },
            onError: (error: any) => {
              showError(
                t("errors.generic"),
                error?.response?.data?.message ||
                  error.message ||
                  t("errors.update")
              );
            },
          }
        );
      }
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const formatDamageAmount = (amount: string): string => {
    try {
      const numAmount = parseFloat(amount);
      return numAmount.toLocaleString("uz-UZ", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return amount;
    }
  };

  const columns: TableColumn<OrderData>[] = [
    {
      key: "type_of_journal",
      header: t("columns.type_of_journal"),
      accessor: (row) =>
        journalTypeLabels[row.type_of_journal] || row.type_of_journal || "",
    },
    {
      key: "date",
      header: t("columns.date"),
      accessor: (row) => formatDate(row.date),
    },
    {
      key: "organization",
      header: t("columns.organization"),
      accessor: (row) => row.organization_info?.name,
    },
    {
      key: "locomotive_info",
      header: t("columns.locomotive"),
      accessor: (row) => row.locomotive_info?.name || "",
    },
    {
      key: "train_number",
      header: t("columns.train_number"),
      accessor: (row) => row.train_number,
    },
    {
      key: "responsible_department",
      header: t("columns.responsible_department"),
      accessor: (row) => row.responsible_department,
    },
    {
      key: "case_description",
      header: t("columns.case_description"),
      accessor: (row) => (
        <div className="max-w-[400px]">
          <div className="whitespace-normal break-words">
            {row.case_description}
          </div>
        </div>
      ),
    },
    {
      key: "damage_amount",
      header: t("columns.damage_amount"),
      accessor: (row) => formatDamageAmount(row.damage_amount),
    },
    {
      key: "file",
      header: t("columns.file"),
      accessor: (row) =>
        row.file ? (
          <a
            className="text-primary underline"
            href={row.file}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncateFilename(row.file ?? "", { length: 20 })}
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "confirm",
      header: t("columns.status"),
      accessor: (row) => (
        <Badge variant={row.confirm ? "success_outline" : "warning_outline"}>
          {row.confirm ? t("status_confirmed") : t("status_not_confirmed")}
        </Badge>
      ),
    },
  ];

  const breadcrumbs = [
    { label: t("breadcrumbs.home"), href: "/" },
    { label: t("breadcrumbs.current"), current: true },
  ];

  const responsibleOrganizationOptions = useMemo(() => {
    const options = [{ value: "", label: t("options.all_responsible") }];
    responsibleOrganizations.forEach((org) =>
      options.push({
        value: org,
        label: org,
      })
    );
    return options;
  }, [t]);

  return (
    <div className="min-h-screen ">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-4">
        <PageFilters
          filters={[
            {
              name: "type_of_journal",
              label: t("filters.journal_type"),
              isSelect: true,
              options: journalTypeOptions,
              placeholder: t("filters.journal_type_placeholder"),
              searchable: false,
            },
            {
              name: "responsible_department",
              label: t("filters.responsible_department"),
              isSelect: true,
              options: responsibleOrganizationOptions,
              placeholder: t("filters.responsible_department_placeholder"),
              searchable: false,
            },
            {
              name: "locomotive",
              label: t("filters.locomotive"),
              isSelect: true,
              options: locomotiveOptions,
              placeholder: t("filters.locomotive_placeholder"),
              searchable: true,
              loading: isLoadingLocomotives,
            },
            ...(canChooseOrganization
              ? [
                  {
                    name: "organization",
                    label: t("filters.organization"),
                    isSelect: true,
                    options: organizationOptions,
                    placeholder: t("filters.organization_placeholder"),
                    searchable: false,
                    loading: isLoadingOrganizations,
                  },
                ]
              : []),
          ]}
          hasSearch={true}
          searchPlaceholder={t("search_placeholder")}
          hasDatePicker={true}
          datePickerLabel={t("date_label")}
          addButtonPermittion={isAdmin ? undefined : "create_order"}
          onAdd={isAdmin ? undefined : handleCreate}
          // onExport={handleExport}
          // exportButtonText="Export EXCEL"
          // exportButtonIcon={<FileSpreadsheet className="w-4 h-4 mr-2" />}
          className="!mb-0"
        />
      </div>

      <div className="px-6 pb-6">
        <PaginatedTable
          columns={columns}
          data={paginatedData}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          error={error}
          totalPages={totalPages}
          totalItems={totalItems}
          updateQueryParams={true}
          onEdit={isAdmin ? undefined : handleEdit}
          onDelete={isAdmin ? undefined : handleDelete}
          deletePermission="delete_order"
          editPermission="edit_order"
          isDeleting={deleteOrderMutation.isPending}
          actionsDisplayMode="row"
          extraActions={
            isAdmin
              ? [
                  {
                    label: "",
                    icon: <CheckCircle className="h-4 w-4" />,
                    onClick: handleConfirmClick,
                    permission: "view_orders" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: OrderData) => !row.confirm,
                    className:
                      "border-success text-success hover:bg-success/10 hover:text-success/80 hover:border-success",
                  },
                ]
              : []
          }
          selectable={true}
          size="sm"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyTitle={t("empty_title")}
          emptyDescription={t("empty_description")}
        />
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        onSave={handleSave}
        order={selectedOrder}
        mode={modalMode}
        isPending={
          createOrderMutation.isPending || updateOrderMutation.isPending
        }
      />

      <ConfirmationDialog
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setOrderToConfirm(null);
        }}
        onConfirm={handleConfirmOrder}
        title={t("confirm_dialog.title")}
        message={
          orderToConfirm
            ? t("confirm_dialog.message_with_train", { trainNumber: orderToConfirm.train_number })
            : t("confirm_dialog.message_generic")
        }
        confirmText={t("confirm_dialog.confirm")}
        cancelText={t("confirm_dialog.cancel")}
        variant="info"
        isDoingAction={confirmOrderMutation.isPending}
        isDoingActionText={t("confirm_dialog.confirming")}
      />
    </div>
  );
}
