"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, type TableColumn } from "@/ui/paginated-table";
import PageFilters from "@/ui/filters";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import { Badge } from "@/ui/badge";
import {
  DelayEntry,
  DelayCreatePayload,
  DelayUpdatePayload,
  DELAY_TYPE_OPTIONS,
  STATION_OPTIONS,
} from "@/api/types/delays";
import {
  useCreateDelay,
  useDelays,
  useDeleteDelay,
  useUpdateDelay,
} from "@/api/hooks/use-delays";
import { DelayModal } from "@/components/delays/delay-modal";
import { ApproveConfirmationModal } from "@/components/delays/approve-confirmation-modal";
import { useSnackbar } from "@/providers/snackbar-provider";
import {
  canAccessSection,
  hasPermission,
  type Permission,
} from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { FileUp, FileEdit, CheckCircle, Edit, Trash2 } from "lucide-react";

export default function DelaysPage() {
  const { getAllQueryValues } = useFilterParams();
  const { updateQuery } = useFilterParams();
  const {
    q,
    page,
    pageSize,
    delay_type,
    date, // Date picker uses "date" as query param
    responsible_org,
    station,
    status,
    archive,
  } = getAllQueryValues();
  const { showSuccess, showError } = useSnackbar();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  if (!currentUser || !canAccessSection(currentUser, "delays")) {
    return <UnauthorizedPage />;
  }

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "moderate">(
    "create"
  );
  const [selectedEntry, setSelectedEntry] = useState<DelayEntry | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveEntry, setApproveEntry] = useState<DelayEntry | null>(null);

  const createMutation = useCreateDelay();
  const updateMutation = useUpdateDelay();
  const deleteMutation = useDeleteDelay();

  // Fetch filter options
  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 25;

  // Parse status from query string
  const statusFilter =
    status === "true" ? true : status === "false" ? false : undefined;

  // Parse archive from query string
  const archiveFilter =
    archive === "true" ? true : archive === "false" ? false : undefined;

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useDelays({
    page: currentPage,
    page_size: itemsPerPage,
    search: q,
    delay_type: delay_type as
      | "Po prosledovaniyu"
      | "Po otpravleniyu"
      | undefined,
    station: station || undefined,
    responsible_org: responsible_org || undefined,
    status: statusFilter,
    archive: archiveFilter,
    incident_date: date || undefined, // Map "date" query param to "incident_date" API param
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

  const handleEdit = useCallback(
    (row: DelayEntry) => {
      // Don't allow editing archived entries
      if (row.archive) {
        return;
      }
      setSelectedEntry(row);
      // If user is sriv_moderator, open in moderate mode (can only edit status and report)
      // Otherwise, open in edit mode (can edit all fields)
      const isModerator = hasPermission(currentUser, "upload_delay_report");
      setModalMode(isModerator ? "moderate" : "edit");
      setIsModalOpen(true);
    },
    [currentUser]
  );

  const handleCloseDelay = useCallback((row: DelayEntry) => {
    // Don't allow editing archived entries
    if (row.archive) {
      return;
    }
    setSelectedEntry(row);
    setModalMode("moderate");
    setIsModalOpen(true);
  }, []);

  const handleApproveClick = useCallback((row: DelayEntry) => {
    // Don't allow approving archived entries
    if (row.archive) {
      return;
    }
    setApproveEntry(row);
    setIsApproveModalOpen(true);
  }, []);

  const handleApproveConfirm = useCallback(async () => {
    if (!approveEntry) return;
    try {
      await updateMutation.mutateAsync({
        id: approveEntry.id,
        payload: { archive: true },
      });
      showSuccess("Kechikish tasdiqlandi va arxivga o'tkazildi");
      setIsApproveModalOpen(false);
      setApproveEntry(null);
    } catch (error: any) {
      showError(
        "Xatolik yuz berdi",
        error?.response?.data?.message ||
          error?.message ||
          "Kechikishni tasdiqlashda xatolik"
      );
      throw error;
    }
  }, [approveEntry, updateMutation, showError, showSuccess]);

  const handleDelete = useCallback(
    async (row: DelayEntry) => {
      // Don't allow deleting archived entries
      if (row.archive) {
        return;
      }
      try {
        await deleteMutation.mutateAsync(row.id);
        showSuccess("Kechikish muvaffaqiyatli o'chirildi");
      } catch (error: any) {
        showError(
          "Xatolik yuz berdi",
          error?.response?.data?.message ||
            error?.message ||
            "Kechikishni o'chirishda xatolik"
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
    (payload: DelayCreatePayload | DelayUpdatePayload) => {
      if (modalMode === "create") {
        createMutation.mutate(payload as DelayCreatePayload, {
          onSuccess: () => {
            showSuccess("Kechikish muvaffaqiyatli qo'shildi");
            setIsModalOpen(false);
            setSelectedEntry(null);
          },
          onError: (error: any) => {
            showError(
              "Xatolik yuz berdi",
              error?.response?.data?.message ||
                error?.message ||
                "Kechikishni qo'shishda xatolik"
            );
          },
        });
      } else if (selectedEntry) {
        updateMutation.mutate(
          {
            id: selectedEntry.id,
            payload: payload as DelayUpdatePayload,
          },
          {
            onSuccess: () => {
              showSuccess("Kechikish muvaffaqiyatli yangilandi");
              setIsModalOpen(false);
              setSelectedEntry(null);
            },
            onError: (error: any) => {
              showError(
                "Xatolik yuz berdi",
                error?.response?.data?.message ||
                  error?.message ||
                  "Kechikishni yangilashda xatolik"
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

  const formatDate = useCallback(
    (dateString: string, isTime: boolean = false) => {
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        if (!isTime) {
          return `${day}.${month}.${year}`;
        }
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      } catch {
        return dateString;
      }
    },
    []
  );

  const formatTime = useCallback((timeString: string) => {
    try {
      // Handle ISO time string like "11:26:53.951Z" or "HH:mm"
      const match = timeString.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, "0")}:${match[2]}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  }, []);

  const truncateFilename = useCallback(
    (filename: string, maxLength: number = 25) => {
      if (!filename || filename.length <= maxLength) {
        return filename;
      }

      // Extract file extension
      const lastDotIndex = filename.lastIndexOf(".");
      if (lastDotIndex === -1) {
        // No extension, just truncate
        return filename.substring(0, maxLength) + "...";
      }

      const extension = filename.substring(lastDotIndex);
      const nameWithoutExt = filename.substring(0, lastDotIndex);
      const availableLength = maxLength - extension.length;

      if (nameWithoutExt.length <= availableLength) {
        return filename;
      }

      return nameWithoutExt.substring(0, availableLength) + "..." + extension;
    },
    []
  );

  const columns: TableColumn<DelayEntry>[] = [
    {
      key: "incident_date",
      header: "Voqea sanasi",
      accessor: (row) =>
        row?.incident_date ? formatDate(row.incident_date, false) : "-",
    },
    {
      key: "delay_type",
      header: "Kechikish turi",
      accessor: (row) => row?.delay_type || "-",
    },
    {
      key: "train_number",
      header: "Poyezd raqami",
      accessor: (row) => row?.train_number || "-",
    },
    {
      key: "station",
      header: "Stansiya",
      accessor: (row) => row?.station || "-",
    },
    {
      key: "delay_time",
      header: "Kechikish vaqti",
      accessor: (row) => (row?.delay_time ? formatTime(row.delay_time) : "-"),
    },
    {
      key: "reason",
      header: "Sabab",
      accessor: (row) => (
        <div className="max-w-[300px] whitespace-pre-wrap break-words">
          {row?.reason || "-"}
        </div>
      ),
    },
    {
      key: "damage_amount",
      header: "Zarar miqdori",
      accessor: (row) =>
        row?.damage_amount
          ? new Intl.NumberFormat("uz-UZ", {
              style: "currency",
              currency: "UZS",
              minimumFractionDigits: 0,
            }).format(row.damage_amount)
          : "0",
    },
    {
      key: "responsible_org",
      header: "Mas'ul tashkilot",
      accessor: (row) =>
        row?.responsible_org_name || row?.responsible_org_detail?.name || "-",
    },
    {
      key: "status",
      header: "Holati",
      accessor: (row) => {
        return (
          <Badge variant={row?.status ? "destructive" : "success"}>
            {row?.status ? "Sriv" : "Sriv emas"}
          </Badge>
        );
      },
    },
    {
      key: "archive",
      header: "Arxiv",
      accessor: (row) => {
        const isArchived = row?.archive;
        return (
          <Badge variant={isArchived ? "default" : "outline"}>
            {isArchived ? "Arxivlangan" : "Arxivlanmagan"}
          </Badge>
        );
      },
    },
    {
      key: "report",
      header: "Hisobot",
      accessor: (row) => {
        if (row?.report_filename || row?.report) {
          const filename = row.report_filename || "Hisobotni ko'rish";
          const truncated = truncateFilename(filename, 25);
          return (
            <div className="max-w-[200px]">
              <a
                href={row.report}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm truncate block"
                title={filename}
              >
                {truncated}
              </a>
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
  ];

  const breadcrumbs = [
    { label: "Asosiy", href: "/" },
    { label: "Kechikishlar", current: true },
  ];

  const delayTypeOptions = useMemo(() => {
    const options = [{ value: "", label: "Barcha turlar" }];
    DELAY_TYPE_OPTIONS.forEach((type) =>
      options.push({
        value: type.value,
        label: type.label,
      })
    );
    return options;
  }, []);

  const stationOptions = useMemo(() => {
    const options = [{ value: "", label: "Barcha stansiyalar" }];
    STATION_OPTIONS.forEach((station) =>
      options.push({
        value: station.value,
        label: station.label,
      })
    );
    return options;
  }, []);

  const organizationOptions = useMemo(() => {
    const options = [{ value: "", label: "Barcha tashkilotlar" }];
    if (organizationsData && Array.isArray(organizationsData)) {
      organizationsData.forEach((org) =>
        options.push({
          value: org.id.toString(),
          label: org.name || `Tashkilot ${org.id}`,
        })
      );
    }
    return options;
  }, [organizationsData]);

  const statusOptions = [
    { value: "", label: "Barcha holatlar" },
    { value: "true", label: "Sriv" },
    { value: "false", label: "Sriv emas" },
  ];

  return (
    <div className="min-h-screen ">
      <PageHeader
        title="Kechikishlar"
        description="Poyezd kechikishlarini kuzatish va boshqarish"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-4">
        <PageFilters
          filters={[
            {
              name: "delay_type",
              label: "Kechikish turi",
              isSelect: true,
              options: delayTypeOptions,
              placeholder: "Kechikish turini tanlang",
              searchable: false,
              loading: false,
            },
            {
              name: "station",
              label: "Stansiya",
              isSelect: true,
              options: stationOptions,
              placeholder: "Stansiyani tanlang",
              searchable: false,
              loading: false,
              permission: "filter_delay_station",
            },
            {
              name: "responsible_org",
              label: "Mas'ul tashkilot",
              isSelect: true,
              options: organizationOptions,
              placeholder: "Tashkilotni tanlang",
              searchable: false,
              loading: isLoadingOrganizations,
            },
            {
              name: "status",
              label: "Holati",
              isSelect: true,
              options: statusOptions,
              placeholder: "Holatni tanlang",
              searchable: false,
              loading: false,
            },
          ]}
          hasSearch
          hasDatePicker
          datePickerLabel="Voqea sanasi"
          searchPlaceholder="Qidiruv"
          addButtonPermittion="create_delay"
          onAdd={handleCreate}
          className="!mb-0"
        />
      </div>

      <div className="px-6 pb-6">
        <PaginatedTable
          columns={columns}
          data={paginatedData}
          getRowId={(row) => row.id}
          itemsPerPage={25}
          size="xs"
          isLoading={isLoading}
          error={error}
          totalPages={totalPages}
          totalItems={totalItems}
          updateQueryParams
          actionsDisplayMode="row"
          extraActions={[
            // Edit action (for sriv_admin only)
            ...(hasPermission(currentUser, "edit_delay") &&
            !hasPermission(currentUser, "upload_delay_report")
              ? [
                  {
                    label: "",
                    icon: <Edit className="h-4 w-4" />,
                    onClick: handleEdit,
                    permission: "edit_delay" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) => !row.archive,
                  },
                ]
              : []),

            // Delete action (for sriv_admin only)
            ...(hasPermission(currentUser, "delete_delay")
              ? [
                  {
                    label: "",
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: handleDelete,
                    permission: "delete_delay" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) => !row.archive,
                    className:
                      "border-red-600 text-red-600 hover:text-red-700 hover:border-red-600 hover:bg-red-600/10",
                  },
                ]
              : []),

            // Upload/Edit report action (for sriv_moderator)
            ...(hasPermission(currentUser, "upload_delay_report")
              ? [
                  {
                    label: "",
                    icon: (row: DelayEntry) =>
                      row?.report || row?.report_filename ? (
                        <FileEdit className="h-4 w-4" />
                      ) : (
                        <FileUp className="h-4 w-4" />
                      ),
                    onClick: handleCloseDelay,
                    permission: "upload_delay_report" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) => !row.archive,
                  },
                ]
              : []),

            // Approve action (for sriv_admin only, when report is uploaded)
            ...(hasPermission(currentUser, "edit_delay") &&
            !hasPermission(currentUser, "upload_delay_report")
              ? [
                  {
                    label: "",
                    icon: <CheckCircle className="h-4 w-4" />,
                    onClick: handleApproveClick,
                    permission: "edit_delay" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) => {
                      const hasReport = !!(row?.report_filename || row?.report);
                      return hasReport && !row.archive;
                    },
                    className:
                      "border-success text-success hover:bg-success/10 hover:text-success/80 hover:border-success",
                  },
                ]
              : []),
          ]}
          isDeleting={deleteMutation.isPending}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyTitle="Ma'lumot topilmadi"
          emptyDescription="Kechikishlar mavjud emas"
          deletePermission="delete_delay"
          editPermission="edit_delay"
        />
      </div>

      <DelayModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSave}
        entry={selectedEntry}
        mode={modalMode}
        isPending={createMutation.isPending || updateMutation.isPending}
        user={currentUser}
      />

      <ApproveConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setApproveEntry(null);
        }}
        onConfirm={handleApproveConfirm}
        entry={approveEntry}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}
