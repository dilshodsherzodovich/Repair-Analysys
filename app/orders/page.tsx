"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import PageFilters from "@/ui/filters";
import { FileSpreadsheet } from "lucide-react";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
} from "@/api/hooks/use-orders";
import { OrderModal } from "@/components/orders/order-modal";
import { useSnackbar } from "@/providers/snackbar-provider";

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const { updateQuery } = useFilterParams();

  // Get query params
  const { q, page, pageSize, tab } = Object.fromEntries(searchParams.entries());

  // State
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [currentTab, setCurrentTab] = useState<string>(tab || "all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  // Hooks
  const { showSuccess, showError } = useSnackbar();
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();

  // Get current page and items per page from query params for API call
  // The table component will handle updating these URL params internally
  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  // Fetch orders from API
  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useOrders({
    page: currentPage,
    page_size: itemsPerPage,
    search: q,
    tab: currentTab === "all" ? undefined : currentTab,
  });

  // Extract data from API response
  const paginatedData = apiResponse?.results || [];
  const totalItems = apiResponse?.count || 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;

  // Convert API error to Error object if needed
  const error = apiError
    ? apiError instanceof Error
      ? apiError
      : new Error(apiError.message || "An error occurred")
    : null;

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    updateQuery({ tab: value, page: "1" });
  };

  // Handle edit
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

  // Handle create
  const handleCreate = () => {
    setSelectedOrder(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Handle save (create or update)
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

  // Handle export
  const handleExport = () => {
    console.log("Export to Excel");
    // Implement export logic
  };

  // Format date from ISO string to display format
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

  // Format damage amount (it comes as string from API)
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

  // Table columns based on API response structure
  const columns: TableColumn<OrderData>[] = [
    {
      key: "date",
      header: "Sana",
      accessor: (row) => formatDate(row.date),
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
  ];

  // Breadcrumb items
  const breadcrumbs = [
    { label: "Asosiy", href: "/" },
    { label: "Buyruq MPR", current: true },
  ];

  return (
    <div className="min-h-screen ">
      {/* Breadcrumb and Header */}
      <PageHeader
        title="Buyruq MPR"
        description="Elektrovozlarni poezdlararo ta'mirlash"
        breadcrumbs={breadcrumbs}
      />

      {/* Navigation Tabs */}
      <div className="px-6">
        <Tabs
          className="w-fit"
          value={currentTab}
          onValueChange={handleTabChange}
        >
          <TabsList className="bg-[#F1F5F9] p-1 gap-0 border-0 rounded-lg inline-flex">
            <TabsTrigger value="all" className={cn()}>
              Barcha lokomotivlar
            </TabsTrigger>
            <TabsTrigger value="chinese">Xitoy Elektrovoz</TabsTrigger>
            <TabsTrigger value="3p9e">3P9E - VL80c - VL60k</TabsTrigger>
            <TabsTrigger value="teplovoz">Teplovoz</TabsTrigger>
            <TabsTrigger value="statistics">Statistika</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters and Actions */}
      <div className="px-6 py-4">
        <PageFilters
          filters={[]}
          hasSearch={true}
          searchPlaceholder="Qidiruv"
          addButtonPermittion="create_order"
          onAdd={handleCreate}
          onExport={handleExport}
          exportButtonText="Export EXCEL"
          exportButtonIcon={<FileSpreadsheet className="w-4 h-4 mr-2" />}
          className="!mb-0"
        />
      </div>

      {/* Table */}
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteOrderMutation.isPending}
          selectable={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyTitle="Ma'lumot topilmadi"
          emptyDescription="Buyruq MPR ma'lumotlari topilmadi"
        />
      </div>

      {/* Order Modal */}
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
    </div>
  );
}
