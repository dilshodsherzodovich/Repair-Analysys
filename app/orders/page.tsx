"use client";

import { useState, useCallback, useMemo } from "react";
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

const journalTypeLabels: Record<string, string> = {
  mpr: "Buyruq MPR",
  invalid: "Brak",
  defect: "Defekt",
};

const journalTypeOptions = [
  { value: "", label: "Barcha jurnal turlari" },
  { value: "mpr", label: "Buyruq MPR" },
  { value: "invalid", label: "Yaroqsiz" },
  { value: "defect", label: "Defekt" },
];

export default function OrdersPage() {
  const { updateQuery, getAllQueryValues } = useFilterParams();

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

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
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
    const options = [{ value: "", label: "Barcha lokomotivlar" }];
    if (locomotivesData && Array.isArray(locomotivesData)) {
      locomotivesData.forEach(
        (locomotive: { id: number; name?: string; model_name?: string }) => {
          options.push({
            value: locomotive.id.toString(),
            label:
              locomotive.name ||
              locomotive.model_name ||
              `Lokomotiv ${locomotive.id}`,
          });
        }
      );
    }
    return options;
  }, [locomotivesData]);

  const organizationOptions = useMemo(() => {
    const options = [{ value: "", label: "Barcha tashkilotlar" }];
    if (canChooseOrganization && organizationsData) {
      organizationsData?.forEach((org) => {
        options.push({
          value: org.id.toString(),
          label: org.name || `Tashkilot ${org.id}`,
        });
      });
    }
    return options;
  }, [organizationsData, canChooseOrganization]);

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useOrders({
    page: currentPage,
    page_size: itemsPerPage,
    search: q || responsible_department,
    type_of_journal: type_of_journal || undefined,
    locomotive: locomotive || undefined,
    date: date || undefined,
    organization: organization || undefined,
  });

  const paginatedData = apiResponse?.results || [];
  const totalItems = apiResponse?.count || 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;

  const error = apiError
    ? apiError instanceof Error
      ? apiError
      : new Error(apiError.message || "An error occurred")
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
        showSuccess("Buyruq MPR muvaffaqiyatli o'chirildi");
      } catch (error: any) {
        showError(
          "Xatolik yuz berdi",
          error?.response?.data?.message ||
            error.message ||
            "Buyruq MPR o'chirishda xatolik"
        );
        throw error;
      }
    },
    [deleteOrderMutation, showError, showSuccess]
  );

  const handleConfirmClick = useCallback((row: OrderData) => {
    setOrderToConfirm(row);
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmOrder = useCallback(async () => {
    if (!orderToConfirm) return;
    try {
      await confirmOrderMutation.mutateAsync(orderToConfirm.id);
      showSuccess("Buyruq MPR muvaffaqiyatli tasdiqlandi");
      setIsConfirmModalOpen(false);
      setOrderToConfirm(null);
    } catch (error: any) {
      showError(
        "Xatolik yuz berdi",
        error?.response?.data?.message ||
          error.message ||
          "Buyruq MPR ni tasdiqlashda xatolik"
      );
      throw error;
    }
  }, [orderToConfirm, confirmOrderMutation, showError, showSuccess]);

  const handleCreate = () => {
    setSelectedOrder(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleSave = (orderData: CreateOrderPayload | UpdateOrderPayload) => {
    if (modalMode === "create") {
      createOrderMutation.mutate(orderData as CreateOrderPayload, {
        onSuccess: () => {
          showSuccess("Buyruq MPR muvaffaqiyatli yaratildi!");
          setIsModalOpen(false);
          setSelectedOrder(null);
        },
        onError: (error: any) => {
          showError(
            "Xatolik yuz berdi",
            error?.response?.data?.message ||
              error.message ||
              "Buyruq MPR yaratishda xatolik"
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
              showSuccess("Buyruq MPR muvaffaqiyatli yangilandi!");
              setIsModalOpen(false);
              setSelectedOrder(null);
            },
            onError: (error: any) => {
              showError(
                "Xatolik yuz berdi",
                error?.response?.data?.message ||
                  error.message ||
                  "Buyruq MPR yangilashda xatolik"
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
      header: "Jurnal turi",
      accessor: (row) =>
        journalTypeLabels[row.type_of_journal] || row.type_of_journal || "",
    },
    {
      key: "date",
      header: "Sana",
      accessor: (row) => formatDate(row.date),
    },
    {
      key: "organization",
      header: "Tashkilot",
      accessor: (row) => row.organization_info?.name,
    },
    {
      key: "locomotive_info",
      header: "Lokomotiv",
      accessor: (row) => row.locomotive_info?.name || "",
    },
    {
      key: "train_number",
      header: "Poyezd raqami",
      accessor: (row) => row.train_number,
    },
    {
      key: "responsible_department",
      header: "Mas'ul tashkilot",
      accessor: (row) => row.responsible_department,
    },
    {
      key: "responsible_person",
      header: "Mas'ul shaxs",
      accessor: (row) => row.responsible_person,
    },
    {
      key: "case_description",
      header: "Hodisa tavsifi",
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
      header: "Zarar summasi",
      accessor: (row) => formatDamageAmount(row.damage_amount),
    },
    {
      key: "file",
      header: "Biriktirilgan fayl",
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
      header: "Holati",
      accessor: (row) => (
        <Badge variant={row.confirm ? "success_outline" : "warning_outline"}>
          {row.confirm ? "Tasdiqlangan" : "Tasdiqlanmagan"}
        </Badge>
      ),
    },
  ];

  const breadcrumbs = [
    { label: "Asosiy", href: "/" },
    { label: "Buyruq MPR", current: true },
  ];

  const responsibleOrganizationOptions = useMemo(() => {
    const options = [{ value: "", label: "Barcha mas'ul tashkilotlar" }];
    responsibleOrganizations.forEach((org) =>
      options.push({
        value: org,
        label: org,
      })
    );
    return options;
  }, []);

  return (
    <div className="min-h-screen ">
      <PageHeader
        title="Buyruq MPR"
        description="Elektrovozlarni poezdlararo ta'mirlash"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-4">
        <PageFilters
          filters={[
            {
              name: "type_of_journal",
              label: "Jurnal turi",
              isSelect: true,
              options: journalTypeOptions,
              placeholder: "Jurnal turini tanlang",
              searchable: false,
            },
            {
              name: "responsible_department",
              label: "Mas'ul tashkilot",
              isSelect: true,
              options: responsibleOrganizationOptions,
              placeholder: "Mas'ul tashkilotni tanlang",
              searchable: false,
            },
            {
              name: "locomotive",
              label: "Lokomotiv",
              isSelect: true,
              options: locomotiveOptions,
              placeholder: "Lokomotivni tanlang",
              searchable: false,
              loading: isLoadingLocomotives,
            },
            ...(canChooseOrganization
              ? [
                  {
                    name: "organization",
                    label: "Tashkilot",
                    isSelect: true,
                    options: organizationOptions,
                    placeholder: "Tashkilotni tanlang",
                    searchable: false,
                    loading: isLoadingOrganizations,
                  },
                ]
              : []),
          ]}
          hasSearch={true}
          searchPlaceholder="Qidiruv"
          hasDatePicker={true}
          datePickerLabel="Sana"
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
          emptyTitle="Ma'lumot topilmadi"
          emptyDescription="Buyruq MPR ma'lumotlari topilmadi"
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
        title="Buyruq MPR ni tasdiqlash"
        message={
          orderToConfirm
            ? `"${orderToConfirm.train_number}" poyezd raqamli buyruqni tasdiqlashni xohlaysizmi?`
            : "Buyruqni tasdiqlashni xohlaysizmi?"
        }
        confirmText="Tasdiqlash"
        cancelText="Bekor qilish"
        variant="info"
        isDoingAction={confirmOrderMutation.isPending}
        isDoingActionText="Tasdiqlanmoqda..."
      />
    </div>
  );
}
