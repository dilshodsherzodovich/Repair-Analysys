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
  usePantographJournal,
  useCreatePantographEntry,
  useUpdatePantographEntry,
  useDeletePantographEntry,
} from "@/api/hooks/use-pantograph";
import {
  PantographJournalEntry,
  CreatePantographJournalPayload,
  UpdatePantographJournalPayload,
} from "@/api/types/pantograph";
import { PantographModal } from "@/components/pantograph/pantograph-modal";
import { useSnackbar } from "@/providers/snackbar-provider";

export default function PantografPage() {
  const searchParams = useSearchParams();
  const { updateQuery } = useFilterParams();

  // Get query params
  const { q, page, pageSize, tab } = Object.fromEntries(searchParams.entries());

  // State
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [currentTab, setCurrentTab] = useState<string>(tab || "all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEntry, setSelectedEntry] =
    useState<PantographJournalEntry | null>(null);

  // Get current page and items per page from query params for data filtering
  // The table component will handle updating these URL params internally
  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = usePantographJournal({
    page: currentPage,
    page_size: itemsPerPage,
    search: q,
    tab: currentTab === "all" ? undefined : currentTab,
  });

  const createEntryMutation = useCreatePantographEntry();
  const updateEntryMutation = useUpdatePantographEntry();
  const deleteEntryMutation = useDeletePantographEntry();
  const { showSuccess, showError } = useSnackbar();

  const paginatedData = apiResponse?.results ?? [];
  const totalItems = apiResponse?.count ?? 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;
  const error = apiError
    ? apiError instanceof Error
      ? apiError
      : new Error(
          (apiError as any)?.message ||
            "Pantograf jurnalini yuklashda xatolik yuz berdi"
        )
    : null;

  // Handle tab change
  const handleTabChange = useCallback(
    (value: string) => {
      setCurrentTab(value);
      updateQuery({ tab: value, page: "1" });
    },
    [updateQuery]
  );

  // Handle edit
  const handleEdit = useCallback((row: PantographJournalEntry) => {
    setSelectedEntry(row);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback(
    async (row: PantographJournalEntry) => {
      try {
        await deleteEntryMutation.mutateAsync(row.id);
        showSuccess("Pantograf jurnali muvaffaqiyatli o'chirildi");
      } catch (error: any) {
        showError(
          "Xatolik yuz berdi",
          error?.response?.data?.message ||
            error?.message ||
            "Pantograf jurnalini o'chirishda xatolik"
        );
        throw error;
      }
    },
    [deleteEntryMutation, showError, showSuccess]
  );

  // Handle create
  const handleCreate = useCallback(() => {
    setSelectedEntry(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  // Handle export
  const handleExport = () => {
    console.log("Export to Excel");
    // Implement export logic
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    console.log("Bulk delete:", selectedIds);
    // Implement bulk delete logic
  };

  const handleSave = useCallback(
    (
      payload: CreatePantographJournalPayload | UpdatePantographJournalPayload
    ) => {
      if (modalMode === "create") {
        createEntryMutation.mutate(payload as CreatePantographJournalPayload, {
          onSuccess: () => {
            showSuccess("Pantograf jurnali muvaffaqiyatli yaratildi!");
            setIsModalOpen(false);
            setSelectedEntry(null);
          },
          onError: (error: any) => {
            showError(
              "Xatolik yuz berdi",
              error?.response?.data?.message ||
                error?.message ||
                "Pantograf jurnalini yaratishda xatolik"
            );
          },
        });
      } else if (selectedEntry) {
        updateEntryMutation.mutate(
          {
            id: selectedEntry.id,
            payload: payload as UpdatePantographJournalPayload,
          },
          {
            onSuccess: () => {
              showSuccess("Pantograf jurnali muvaffaqiyatli yangilandi!");
              setIsModalOpen(false);
              setSelectedEntry(null);
            },
            onError: (error: any) => {
              showError(
                "Xatolik yuz berdi",
                error?.response?.data?.message ||
                  error?.message ||
                  "Pantograf jurnalini yangilashda xatolik"
              );
            },
          }
        );
      }
    },
    [
      modalMode,
      selectedEntry,
      createEntryMutation,
      updateEntryMutation,
      showSuccess,
      showError,
    ]
  );

  // Table columns
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

  const formatDamage = (amount: string): string => {
    if (!amount) return "-";
    const parsed = Number(amount);
    if (Number.isNaN(parsed)) return amount;
    return parsed.toLocaleString("uz-UZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const columns: TableColumn<PantographJournalEntry>[] = [
    {
      key: "date",
      header: "Sana",
      accessor: (row) => formatDate(row.date),
    },
    {
      key: "title",
      header: "Sarlavha",
      accessor: (row) => row.title,
    },
    {
      key: "locomotive_info",
      header: "Lokomotiv",
      accessor: (row) =>
        row.locomotive_info
          ? `${row.locomotive_info.name} (${row.locomotive_info.locomotive_model.name})`
          : "-",
    },
    {
      key: "department",
      header: "Mas'ul tashkilot",
      accessor: (row) => row.department,
    },
    {
      key: "section",
      header: "Uchastka",
      accessor: (row) => (
        <div className="max-w-[300px]">
          <div className="whitespace-normal break-words">{row.section}</div>
        </div>
      ),
    },
    {
      key: "organization_info",
      header: "Tashkilot",
      accessor: (row) => row.organization_info || "-",
    },
    {
      key: "description",
      header: "Hodisa tavsifi",
      accessor: (row) => (
        <div className="max-w-[400px]">
          <div className="whitespace-normal break-words">{row.description}</div>
        </div>
      ),
    },
    {
      key: "damage",
      header: "Zarar summasi",
      accessor: (row) => formatDamage(row.damage),
    },
  ];

  // Breadcrumb items
  const breadcrumbs = [
    { label: "Asosiy", href: "/" },
    { label: "Pantograf", current: true },
  ];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb and Header */}
      <PageHeader
        title="Pantograf"
        description="Bu qurilmalar elektrovozning asosiy komponentlari hisoblanadi."
        breadcrumbs={breadcrumbs}
      />

      {/* Navigation Tabs */}
      <div className="px-6">
        <Tabs
          className="w-fit"
          value={currentTab}
          onValueChange={handleTabChange}
        >
          <TabsList className="bg-[#F1F5F9] p-2 gap-0 border-0 rounded-lg inline-flex ">
            <TabsTrigger value="all" className={cn()}>
              Barcha lokomotivlar
            </TabsTrigger>
            <TabsTrigger value="chinese">Xitoy Elektrovoz</TabsTrigger>
            <TabsTrigger value="3p9e">3P9E - VL80c - VL60k</TabsTrigger>
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
          onAdd={handleCreate}
          addButtonText="Yangi qo'shish"
          addButtonPermittion="create_pantograf"
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
          isDeleting={deleteEntryMutation.isPending}
          selectable={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyTitle="Ma'lumot topilmadi"
          emptyDescription="Pantograf ma'lumotlari topilmadi"
        />
      </div>

      <PantographModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSave}
        entry={selectedEntry}
        mode={modalMode}
        isPending={
          createEntryMutation.isPending || updateEntryMutation.isPending
        }
      />
    </div>
  );
}
