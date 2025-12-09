"use client";

import { useState, useCallback, useMemo } from "react";
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
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { truncateFilename } from "@/utils/format-filename";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { hasPermission } from "@/lib/permissions";

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
  const searchParams = useSearchParams();
  const { updateQuery } = useFilterParams();

  // Get query params
  const {
    q,
    page,
    pageSize,
    tab,
    type_of_journal,
    locomotive,
    date,
    organization,
  } = Object.fromEntries(searchParams.entries());

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

  // Fetch locomotives for filter
  const { data: locomotivesData, isLoading: isLoadingLocomotives } =
    useGetLocomotives();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  if (!currentUser || !canAccessSection(currentUser, "orders")) {
    return <UnauthorizedPage />;
  }

  // Check if user has choose_organization permission
  const canChooseOrganization = hasPermission(
    currentUser,
    "choose_organization"
  );

  // Fetch organizations if user has permission
  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  // Prepare locomotive options for filter
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

  // Prepare organization options for filter
  const organizationOptions = useMemo(() => {
    const options = [{ value: "", label: "Barcha tashkilotlar" }];
    if (canChooseOrganization && organizationsData) {
      organizationsData?.forEach((org) => {
        options.push({
          value: org.id.toString(),
          label:
            org.name || org.name_uz || org.name_ru || `Tashkilot ${org.id}`,
        });
      });
    }
    return options;
  }, [organizationsData, canChooseOrganization]);

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
    type_of_journal: type_of_journal || undefined,
    locomotive: locomotive || undefined,
    date: date || undefined,
    organization: organization || undefined,
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
      accessor: (row) => row.organization_info,
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
      {/* <div className="px-6">
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
      </div> */}

      {/* Filters and Actions */}
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
          size="sm"
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
