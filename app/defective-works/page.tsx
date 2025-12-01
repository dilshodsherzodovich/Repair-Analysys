"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, type TableColumn } from "@/ui/paginated-table";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import PageFilters from "@/ui/filters";
import { FileSpreadsheet } from "lucide-react";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
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
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";

export default function DefectiveWorksPage() {
  const searchParams = useSearchParams();
  const { updateQuery } = useFilterParams();
  const { showSuccess, showError } = useSnackbar();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  if (!currentUser || !canAccessSection(currentUser, "defective-works")) {
    return <UnauthorizedPage />;
  }

  const { q, page, pageSize, tab } = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams]
  );

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [currentTab, setCurrentTab] = useState<string>(tab || "all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEntry, setSelectedEntry] = useState<DefectiveWorkEntry | null>(
    null
  );

  const createMutation = useCreateDefectiveWork();
  const updateMutation = useUpdateDefectiveWork();
  const deleteMutation = useDeleteDefectiveWork();

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useDefectiveWorks({
    page: currentPage,
    page_size: itemsPerPage,
    search: q,
    tab: currentTab === "all" ? undefined : currentTab,
  });

  const paginatedData = apiResponse?.results ?? [];
  const totalItems = apiResponse?.count ?? 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;

  const error =
    apiError instanceof Error
      ? apiError
      : apiError
      ? new Error(apiError?.message || "Xatolik yuz berdi")
      : null;

  const handleTabChange = useCallback(
    (value: string) => {
      setCurrentTab(value);
      updateQuery({ tab: value, page: "1" });
    },
    [updateQuery]
  );

  const handleEdit = useCallback((row: DefectiveWorkEntry) => {
    setSelectedEntry(row);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (row: DefectiveWorkEntry) => {
      try {
        await deleteMutation.mutateAsync(row.id);
        showSuccess("Nosoz ish muvaffaqiyatli o'chirildi");
      } catch (error: any) {
        showError(
          "Xatolik yuz berdi",
          error?.response?.data?.message ||
            error?.message ||
            "Nosoz ishni o'chirishda xatolik"
        );
        throw error;
      }
    },
    [deleteMutation, showError, showSuccess]
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
            showSuccess("Nosoz ish muvaffaqiyatli qo'shildi");
            setIsModalOpen(false);
            setSelectedEntry(null);
          },
          onError: (error: any) => {
            showError(
              "Xatolik yuz berdi",
              error?.response?.data?.message ||
                error?.message ||
                "Nosoz ishni qo'shishda xatolik"
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
              showSuccess("Nosoz ish muvaffaqiyatli yangilandi");
              setIsModalOpen(false);
              setSelectedEntry(null);
            },
            onError: (error: any) => {
              showError(
                "Xatolik yuz berdi",
                error?.response?.data?.message ||
                  error?.message ||
                  "Nosoz ishni yangilashda xatolik"
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
    ]
  );

  const handleExport = useCallback(() => {
    console.log("Defective works export");
  }, []);

  const formatDate = useCallback((dateString: string) => {
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
  }, []);

  const columns: TableColumn<DefectiveWorkEntry>[] = [
    {
      key: "date",
      header: "Sana",
      accessor: (row) => formatDate(row.date),
    },
    {
      key: "organization_info",
      header: "Tashkilot",
      accessor: (row) => row.organization_info.name,
    },
    {
      key: "locomotive_info",
      header: "Lokomotiv",
      accessor: (row) =>
        `${row.locomotive_info.name} (${row.locomotive_info.locomotive_model})`,
    },
    {
      key: "inspection_type_info",
      header: "Tekshiruv turi",
      accessor: (row) =>
        `${row.inspection_type_info.name} (${row.inspection_type_info.inspection_type})`,
    },
    {
      key: "train_driver",
      header: "Mashinist",
      accessor: (row) => row.train_driver,
    },
    {
      key: "code",
      header: "Kod",
      accessor: (row) => row.code,
    },
    {
      key: "issue",
      header: "Nosozlik",
      accessor: (row) => (
        <div className="max-w-[400px] whitespace-pre-wrap break-words">
          {row.issue}
        </div>
      ),
    },
    {
      key: "table_number",
      header: "Tabel raqami",
      accessor: (row) => row.table_number,
    },
  ];

  const breadcrumbs = [
    { label: "Asosiy", href: "/" },
    { label: "Nosoz ishlar jurnali", current: true },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Nosoz ishlar jurnali"
        description="Tekshirishlar va nosozliklarni kuzatish"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="bg-[#F1F5F9] p-1 gap-0 border-0 rounded-lg inline-flex">
            <TabsTrigger value="all">Barcha yozuvlar</TabsTrigger>
            <TabsTrigger value="chinese">Xitoy Elektrovoz</TabsTrigger>
            <TabsTrigger value="3p9e">3P9E - VL80c - VL60k</TabsTrigger>
            <TabsTrigger value="teplovoz">Teplovoz</TabsTrigger>
            <TabsTrigger value="statistics">Statistika</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-6 py-4">
        <PageFilters
          filters={[]}
          hasSearch
          searchPlaceholder="Qidiruv"
          addButtonPermittion="create_defective_work"
          onAdd={handleCreate}
          onExport={handleExport}
          exportButtonText="Export EXCEL"
          exportButtonIcon={<FileSpreadsheet className="w-4 h-4 mr-2" />}
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
          updateQueryParams
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyTitle="Ma'lumot topilmadi"
          emptyDescription="Nosoz ishlar mavjud emas"
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
    </div>
  );
}
