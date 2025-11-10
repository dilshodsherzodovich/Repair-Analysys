"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import PageFilters from "@/ui/filters";
import { FileSpreadsheet } from "lucide-react";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Mock data type
interface PantografData {
  id: string;
  sana: string;
  lokomotiv: string;
  uchastka: string;
  xizmat: string;
  sababi: string;
  ushreb: number;
  user_id: string;
}

// Mock data generator
const generateMockData = (count: number): PantografData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `pantograf-${i + 1}`,
    sana: "2025.07.09",
    lokomotiv: "610-06 - 3P9E",
    uchastka: "Guliston Oqoltin 3477km 4-pk",
    xizmat: "33-7",
    sababi: "Kontakt tarmog'ini kontakt tori (strunasi) chiqib qolgan",
    ushreb: 2158276.07,
    user_id: `user-${i + 1}`,
  }));
};

export default function PantografPage() {
  const searchParams = useSearchParams();
  const { updateQuery, getQueryValue } = useFilterParams();

  // Get query params
  const { q, page, tab } = Object.fromEntries(searchParams.entries());

  // State
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [currentTab, setCurrentTab] = useState<string>(tab || "all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Mock data - replace with actual API call
  const mockData = generateMockData(1000);
  const currentPage = page ? parseInt(page) : 1;

  // Filter data based on search and tab
  const filteredData = mockData.filter((item) => {
    if (q) {
      const searchLower = q.toLowerCase();
      return (
        item.lokomotiv.toLowerCase().includes(searchLower) ||
        item.uchastka.toLowerCase().includes(searchLower) ||
        item.sababi.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Paginate data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const totalPages = getPageCount(filteredData.length, itemsPerPage) || 1;
  const totalItems = filteredData.length;

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    updateQuery({ tab: value, page: "1" });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    updateQuery({ page: page.toString() });
    setSelectedIds([]);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    updateQuery({ page: "1" });
  };

  // Handle edit
  const handleEdit = (row: PantografData) => {
    console.log("Edit:", row);
    // Implement edit logic
  };

  // Handle delete
  const handleDelete = (row: PantografData) => {
    console.log("Delete:", row);
    // Implement delete logic
  };

  // Handle create
  const handleCreate = () => {
    console.log("Create new");
    // Implement create logic
  };

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

  // Table columns
  const columns: TableColumn<PantografData>[] = [
    {
      key: "sana",
      header: "Sana",
      accessor: (row) => row.sana,
    },
    {
      key: "lokomotiv",
      header: "Lokomotiv",
      accessor: (row) => row.lokomotiv,
    },
    {
      key: "uchastka",
      header: "Uchastka",
      accessor: (row) => (
        <div className="max-w-[300px]">
          <div className="whitespace-normal break-words">{row.uchastka}</div>
        </div>
      ),
    },
    {
      key: "xizmat",
      header: "Xizmat",
      accessor: (row) => row.xizmat,
    },
    {
      key: "sababi",
      header: "Sababi",
      accessor: (row) => (
        <div className="max-w-[400px]">
          <div className="whitespace-normal break-words">{row.sababi}</div>
        </div>
      ),
    },
    {
      key: "ushreb",
      header: "Ushreb",
      accessor: (row) =>
        row.ushreb.toLocaleString("uz-UZ", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      key: "user_id",
      header: "user_id",
      accessor: (row) => row.user_id,
    },
  ];

  // Breadcrumb items
  const breadcrumbs = [
    { label: "Asosiy", href: "/" },
    { label: "Pantograf", current: true },
  ];

  useEffect(() => {
    if (!page) {
      updateQuery({ page: "1" });
    }
  }, [page]);

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
          isLoading={false}
          error={null}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectable={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyTitle="Ma'lumot topilmadi"
          emptyDescription="Pantograf ma'lumotlari topilmadi"
        />
      </div>
    </div>
  );
}
