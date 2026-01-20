"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { PaginatedTable, type TableColumn } from "@/ui/paginated-table";
import PageFilters from "@/ui/filters";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { Badge } from "@/ui/badge";
import { useTU152List, useTU152Locomotives, useTU152LocomotiveModels, useUpdateTU152Entry } from "@/api/hooks/use-tu152";
import { TU152Entry, TU152_STATUSES, TU152UpdatePayload } from "@/api/types/tu152";
import { DatePicker } from "@/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { PaginationEllipsis, PaginationLink } from "@/ui/pagination";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { TU152Modal } from "@/components/defective-works/tu152-modal";
import { useSnackbar } from "@/providers/snackbar-provider";
import { Permission } from "@/lib/permissions";

export function TU152Tab() {
  const { getAllQueryValues, updateQuery, getQueryValue } = useFilterParams();
  const {
    p_create_date_from,
    p_create_date_to,
    p_lokomotiv_id,
    p_lokomotiv_seriya_id,
    p_status_id,
  } = getAllQueryValues();

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TU152Entry | null>(null);
  const { showSuccess, showError } = useSnackbar();

  const updateMutation = useUpdateTU152Entry();
  
  const getDateFromQuery = (dateStr: string | undefined): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  };

  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    getDateFromQuery(p_create_date_from)
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    getDateFromQuery(p_create_date_to)
  );

  // Sync dates with query params when they change
  useEffect(() => {
    setDateFrom(getDateFromQuery(p_create_date_from));
  }, [p_create_date_from]);

  useEffect(() => {
    setDateTo(getDateFromQuery(p_create_date_to));
  }, [p_create_date_to]);

  const { data: tu152Data, isLoading, error: apiError } = useTU152List({
    p_create_date_from: dateFrom?.toISOString().split("T")[0],
    p_create_date_to: dateTo?.toISOString().split("T")[0],
    p_lokomotiv_id: p_lokomotiv_id || undefined,
    p_lokomotiv_seriya_id: p_lokomotiv_seriya_id || undefined,
    p_status_id: p_status_id || undefined,
  });

  const { data: locomotivesData, isLoading: isLoadingLocomotives } =
    useTU152Locomotives();
  const { data: locomotiveModelsData, isLoading: isLoadingLocomotiveModels } =
    useTU152LocomotiveModels();

  // Frontend pagination
  const allData = tu152Data?.data ?? [];
  const itemsPerPage = 25;
  const currentPage = parseInt(getQueryValue("page") || "1");
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = allData.slice(startIndex, endIndex);
  const totalItems = allData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const error =
    apiError instanceof Error
      ? apiError
      : apiError
      ? new Error(apiError?.message || "Xatolik yuz berdi")
      : null;

  const formatDate = useCallback(
    (dateString: string, isTime: boolean = true) => {
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return isTime
          ? `${day}.${month}.${year} ${hours}:${minutes}`
          : `${day}.${month}.${year}`;
      } catch {
        return dateString;
      }
    },
    []
  );

  const getStatusBadge = useCallback((statusId: number) => {
    const status = TU152_STATUSES.find((s) => s.id === statusId);
    if (!status) return null;

    let variant: "outline" | "success_outline" | "destructive_outline" | "warning_outline" = "outline";
    if (statusId === 24) variant = "success_outline";
    else if (statusId === 22) variant = "warning_outline";
    else if (statusId === 23) variant = "destructive_outline";

    return <Badge variant={variant}>{status.name}</Badge>;
  }, []);

  const columns: TableColumn<TU152Entry>[] = [
    // {
    //   key: "create_date",
    //   header: "Yaratilgan sana",
    //   accessor: (row) => (row?.create_date ? formatDate(row.create_date) : ""),
    //   width: "150px",
    //   className: "min-w-[150px] whitespace-nowrap",
    //   headerClassName: "min-w-[150px]",
    // },
    {
      key: "lokomotiv_number",
      header: "Lokomotiv",
      accessor: (row) => `${row.lokomotiv_number} (${row.lokomotiv_seriya_name})`,
      width: "150px",
      className: "min-w-[150px] whitespace-nowrap",
      headerClassName: "min-w-[150px]",
    },
    {
      key: "group_name",
      header: "Guruh",
      accessor: (row) => row?.group_name || "-",
      width: "200px",
      className: "min-w-[200px]",
      headerClassName: "min-w-[200px]",
    },
    {
      key: "mashinist_fio",
      header: "Mashinist",
      accessor: (row) => row?.mashinist_fio || "-",
      width: "200px",
      className: "min-w-[200px]",
      headerClassName: "min-w-[200px]",
    },
    // {
    //   key: "depo_name",
    //   header: "Depo",
    //   accessor: (row) => row?.depo_name || "-",
    //   width: "180px",
    //   className: "min-w-[180px]",
    //   headerClassName: "min-w-[180px]",
    // },
    // {
    //   key: "organization_name",
    //   header: "Tashkilot",
    //   accessor: (row) => row?.organization_name || "-",
    //   width: "150px",
    //   className: "min-w-[150px]",
    //   headerClassName: "min-w-[150px]",
    // },
    {
      key: "comments",
      header: "Izoh",
      accessor: (row) => (
        <div className="min-w-[300px] whitespace-pre-wrap break-words">
          {row?.comments || "-"}
        </div>
      ),
      width: "300px",
      className: "min-w-[300px]",
      headerClassName: "min-w-[300px]",
    },
    {
      key: "answer",
      header: "Javob",
      accessor: (row) => (
        <div className="min-w-[300px] whitespace-pre-wrap break-words">
          {row?.answer || "-"}
        </div>
      ),
      width: "300px",
      className: "min-w-[300px]",
      headerClassName: "min-w-[300px]",
    },
    {
      key: "status_name",
      header: "Holati",
      accessor: (row) => getStatusBadge(row?.status_id),
      width: "180px",
      className: "min-w-[180px]",
      headerClassName: "min-w-[180px]",
    },
    // {
    //   key: "create_user_fio",
    //   header: "Yaratgan",
    //   accessor: (row) => row?.create_user_fio || "-",
    //   width: "200px",
    //   className: "min-w-[200px]",
    //   headerClassName: "min-w-[200px]",
    // },
    // {
    //   key: "change_user_fio",
    //   header: "O'zgartirgan",
    //   accessor: (row) => row?.change_user_fio || "-",
    //   width: "200px",
    //   className: "min-w-[200px]",
    //   headerClassName: "min-w-[200px]",
    // },
    {
      key: "change_date",
      header: "O'zgartirilgan sana",
      accessor: (row) => (row?.change_date ? formatDate(row.change_date) : ""),
      width: "150px",
      className: "min-w-[150px] whitespace-nowrap",
      headerClassName: "min-w-[150px]",
    },
  ];

  const locomotiveOptions = useMemo(() => {
    const options = [{ value: "", label: "Barcha lokomotivlar" }];
    if (locomotivesData?.data && Array.isArray(locomotivesData.data)) {
      locomotivesData.data.forEach((loc) =>
        options.push({
          value: loc.value,
          label: loc.text,
        })
      );
    }
    return options;
  }, [locomotivesData]);

  const locomotiveModelOptions = useMemo(() => {
    const options = [{ value: "", label: "Barcha seriyalar" }];
    if (locomotiveModelsData?.data && Array.isArray(locomotiveModelsData.data)) {
      locomotiveModelsData.data.forEach((model) =>
        options.push({
          value: model.value,
          label: model.text,
        })
      );
    }
    return options;
  }, [locomotiveModelsData]);

  const statusOptions = useMemo(() => {
    const options = [{ value: "", label: "Barcha holatlar" }];
    TU152_STATUSES.forEach((status) =>
      options.push({
        value: status.id.toString(),
        label: status.name,
      })
    );
    return options;
  }, []);

  const handleDateFromChange = useCallback(
    (date: Date | undefined) => {
      setDateFrom(date);
      updateQuery({
        p_create_date_from: date ? date.toISOString().split("T")[0] : null,
      });
    },
    [updateQuery]
  );

  const handleDateToChange = useCallback(
    (date: Date | undefined) => {
      setDateTo(date);
      updateQuery({
        p_create_date_to: date ? date.toISOString().split("T")[0] : null,
      });
    },
    [updateQuery]
  );

  const handleEdit = useCallback((row: TU152Entry) => {
    setSelectedEntry(row);
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(
    (payload: TU152UpdatePayload) => {
      if (!selectedEntry) return;

      updateMutation.mutate(
        {
          id: selectedEntry.id,
          payload,
        },
        {
          onSuccess: () => {
            showSuccess("TU152 nosozlik muvaffaqiyatli yangilandi");
            setIsModalOpen(false);
            setSelectedEntry(null);
          },
          onError: (error: any) => {
            showError(
              "Xatolik yuz berdi",
              error?.response?.data?.message ||
                error?.message ||
                "TU152 nosozlikni yangilashda xatolik"
            );
          },
        }
      );
    },
    [selectedEntry, updateMutation, showSuccess, showError]
  );

  return (
    <>
      <div className="px-6 py-4">
        <div className="bg-white border p-4 mb-4">
          <div className="flex flex-wrap md:flex-nowrap items-end gap-4 overflow-x-auto">
            <div className="min-w-[200px] flex-1">
              <DatePicker
                label=""
                value={dateFrom}
                onValueChange={handleDateFromChange}
                placeholder="Boshlanish sanasi"
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <DatePicker
                label=""
                value={dateTo}
                onValueChange={handleDateToChange}
                placeholder="Tugash sanasi"
              />
            </div>
            <PageFilters
              filters={[
                {
                  name: "p_lokomotiv_id",
                  label: "Lokomotiv",
                  isSelect: true,
                  options: locomotiveOptions,
                  placeholder: "Lokomotivni tanlang",
                  searchable: false,
                  loading: isLoadingLocomotives,
                },
                {
                  name: "p_lokomotiv_seriya_id",
                  label: "Lokomotiv seriyasi",
                  isSelect: true,
                  options: locomotiveModelOptions,
                  placeholder: "Seriyani tanlang",
                  searchable: false,
                  loading: isLoadingLocomotiveModels,
                },
                {
                  name: "p_status_id",
                  label: "Holat",
                  isSelect: true,
                  options: statusOptions,
                  placeholder: "Holatni tanlang",
                  searchable: false,
                },
              ]}
              hasSearch={false}
              className="!mb-0 flex-nowrap"
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-4">
        <div className="bg-white border">
          <div className="w-full overflow-x-auto">
            <div >
              <PaginatedTable
              columns={columns}
              data={paginatedData}
              getRowId={(row) => row.id}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={(page) => updateQuery({ page: page.toString() })}
              onItemsPerPageChange={(newItemsPerPage) =>
                updateQuery({ page: "1", pageSize: newItemsPerPage.toString() })
              }
              extraActions={
                [
                  {
                    label: "Tahrirlash",
                    icon: <Edit className="h-4 w-4" />,
                    onClick: handleEdit,
                    variant: "outline",
                  },
                ]
              }
              size="sm"
              isLoading={isLoading}
              error={error}
              totalPages={0}
              totalItems={totalItems}
              updateQueryParams={false}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              emptyTitle="Ma'lumot topilmadi"
              emptyDescription="TU152 nosozliklar mavjud emas"
              className="!pb-0"
              actionsDisplayMode="row"
              // onEdit={handleEdit}
            />
            </div>
          </div>
        </div>

        {totalPages > 0 && (
          <div className="flex items-center justify-end pt-4 px-0 bg-white border p-4">
          

            {totalPages > 1 && (
              <div className="flex items-center gap-4 ">
                <ul className="flex flex-row items-center gap-1">
                  {currentPage > 1 && (
                    <li>
                      <button
                        type="button"
                        onClick={() => updateQuery({ page: (currentPage - 1).toString() })}
                        className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Orqaga</span>
                      </button>
                    </li>
                  )}

                  {(() => {
                    const pages: (number | string)[] = [];
                    const maxVisible = 5;
                    const halfVisible = Math.floor(maxVisible / 2);
                    let startPage = Math.max(1, currentPage - halfVisible);
                    let endPage = Math.min(totalPages, currentPage + halfVisible);

                    if (currentPage <= halfVisible) {
                      endPage = Math.min(totalPages, maxVisible);
                    }
                    if (currentPage > totalPages - halfVisible) {
                      startPage = Math.max(1, totalPages - maxVisible + 1);
                    }

                    if (startPage > 1) {
                      pages.push(1);
                      if (startPage > 2) {
                        pages.push("...");
                      }
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }

                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push("...");
                      }
                      pages.push(totalPages);
                    }

                    return pages.map((page, index) => (
                      <li key={index}>
                        {page === "..." ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => updateQuery({ page: (page as number).toString() })}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </li>
                    ));
                  })()}

                  {currentPage < totalPages && (
                    <li>
                      <button
                        type="button"
                        onClick={() => updateQuery({ page: (currentPage + 1).toString() })}
                        className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors gap-1"
                      >
                        <span>Oldinga</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </li>
                  )}
                </ul>
                {totalItems && (
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Showing{" "}
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{" "}
                    of {totalItems} results
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <TU152Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSave}
        entry={selectedEntry}
        isPending={updateMutation.isPending}
      />
    </>
  );
}

