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
  TRAIN_TYPE_OPTIONS,
  GROUP_REASON_OPTIONS,
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
import { useTranslations } from "next-intl";

export default function DelaysPage() {
  const t = useTranslations("DelaysPage");
  const { getAllQueryValues } = useFilterParams();
  const { updateQuery } = useFilterParams();
  const {
    q,
    page,
    pageSize,
    delay_type,
    start_date,
    end_date,
    responsible_org,
    station,
    status,
    archive,
    train_type,
    group_reason,
  } = getAllQueryValues();
  const { showSuccess, showError } = useSnackbar();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  if (!currentUser || !canAccessSection(currentUser, "delays")) {
    return <UnauthorizedPage />;
  }

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "moderate">(
    "create",
  );
  const [selectedEntry, setSelectedEntry] = useState<DelayEntry | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveEntry, setApproveEntry] = useState<DelayEntry | null>(null);

  const createMutation = useCreateDelay();
  const updateMutation = useUpdateDelay();
  const deleteMutation = useDeleteDelay();

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

  const getTrainTypeLabel = (value?: string | null) => {
    if (!value) return "-";
    return t(`train_types.${value}` as any);
  };

  const getGroupReasonLabel = (value?: string | null) => {
    if (!value) return "-";
    const option = GROUP_REASON_OPTIONS.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const getDelayTypeLabel = (value?: string | null) => {
    if (!value) return "-";
    return t(`delay_types.${value}` as any);
  };

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
    from_date: start_date || undefined, // Map "start_date" query param to "from_date" API param
    end_date: end_date || undefined, // Map "end_date" query param to "end_date" API param
    train_type: train_type || undefined,
    group_reason: group_reason || undefined,
  });

  const paginatedData = apiResponse?.results ?? [];
  const totalItems = apiResponse?.count ?? 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;

  const error =
    apiError instanceof Error
      ? apiError
      : apiError
        ? new Error(apiError?.message || t("messages.generic_error"))
        : null;

  const handleEdit = useCallback(
    (row: DelayEntry) => {
      if (row.archive) {
        return;
      }
      setSelectedEntry(row);
      const isModerator = hasPermission(currentUser, "upload_delay_report");
      setModalMode(isModerator ? "moderate" : "edit");
      setIsModalOpen(true);
    },
    [currentUser],
  );

  const handleCloseDelay = useCallback((row: DelayEntry) => {
    if (row.archive) {
      return;
    }
    setSelectedEntry(row);
    setModalMode("moderate");
    setIsModalOpen(true);
  }, []);

  const handleApproveClick = useCallback((row: DelayEntry) => {
    if (row.archive) {
      return;
    }
    setApproveEntry(row);
    setIsApproveModalOpen(true);
  }, []);

  const handleApproveConfirm = useCallback(async () => {
    if (!approveEntry) return;
    updateMutation.mutate(
      {
        id: approveEntry.id,
        payload: {
          archive: true,
        },
      },
      {
        onSuccess: () => {
          showSuccess(t("messages.approve_success"));
          setIsApproveModalOpen(false);
          setApproveEntry(null);
        },
        onError: (error: any) => {
          showError(
            t("messages.approve_error_title"),
            error?.response?.data?.message ||
              error?.message ||
              t("messages.approve_error_message"),
          );
        },
      },
    );
  }, [approveEntry, updateMutation, showError, showSuccess]);

  const handleDelete = useCallback(
    async (row: DelayEntry) => {
      if (row.archive) {
        return;
      }
      try {
        await deleteMutation.mutateAsync(row.id);
        showSuccess(t("messages.delete_success"));
      } catch (error: any) {
        showError(
          t("messages.delete_error_title"),
          error?.response?.data?.message ||
            error?.message ||
            t("messages.delete_error_message"),
        );
        throw error;
      }
    },
    [deleteMutation, showError, showSuccess],
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
            showSuccess(t("messages.create_success"));
            setIsModalOpen(false);
            setSelectedEntry(null);
          },
          onError: (error: any) => {
            showError(
              t("messages.create_error_title"),
              error?.response?.data?.message ||
                error?.message ||
                t("messages.create_error_message"),
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
              showSuccess(t("messages.update_success"));
              setIsModalOpen(false);
              setSelectedEntry(null);
            },
            onError: (error: any) => {
              showError(
                t("messages.update_error_title"),
                error?.response?.data?.message ||
                  error?.message ||
                  t("messages.update_error_message"),
              );
            },
          },
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
    ],
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
    [],
  );

  const formatTime = useCallback((timeString: string) => {
    try {
      const match = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        const hours = match[1].padStart(2, "0");
        const minutes = match[2].padStart(2, "0");
        return `${hours}:${minutes}`;
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

      const lastDotIndex = filename.lastIndexOf(".");
      if (lastDotIndex === -1) {
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
    [],
  );

  const columns: TableColumn<DelayEntry>[] = [
    {
      key: "incident_date",
      header: t("columns.incident_date"),
      accessor: (row) =>
        row?.incident_date ? formatDate(row.incident_date, false) : "-",
    },

    {
      key: "train_number",
      header: t("columns.train_number"),
      accessor: (row) => row?.train_number || "-",
      width: "20px",
    },
    {
      key: "train_type",
      header: t("columns.train_type"),
      accessor: (row) => {
        if (row?.train_type) {
          return getTrainTypeLabel(row.train_type);
        }
        return "-";
      },
    },
    {
      key: "delay_type",
      header: t("columns.delay_type"),
      accessor: (row) =>
        row?.delay_type ? getDelayTypeLabel(row.delay_type) : "-",
      width: "150px",
    },
    {
      key: "group_reason",
      header: t("columns.group_reason"),
      accessor: (row) => {
        if (row?.group_reason) {
          return getGroupReasonLabel(row.group_reason);
        }
        return "-";
      },
    },
    {
      key: "station",
      header: t("columns.station"),
      accessor: (row) => row?.station || "-",
      width: "100px",
    },
    {
      key: "delay_time",
      header: t("columns.delay_time"),
      accessor: (row) => (row?.delay_time ? formatTime(row.delay_time) : "-"),
    },
    {
      key: "reason",
      header: t("columns.reason"),
      accessor: (row) => (
        <div className="max-w-[300px] whitespace-pre-wrap break-words">
          {row?.reason || "-"}
        </div>
      ),
    },
    {
      key: "damage_amount",
      header: t("columns.damage_amount"),
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
      header: t("columns.responsible_org"),
      accessor: (row) =>
        row?.responsible_org_name || row?.responsible_org_detail?.name || "-",
    },
    {
      key: "status",
      header: t("columns.status"),
      accessor: (row) => {
        return (
          <Badge
            variant={row?.status ? "destructive_outline" : "success_outline"}
          >
            {row?.status
              ? t("status.label_disruption")
              : t("status.label_no_disruption")}
          </Badge>
        );
      },
      width: "100px",
    },
    {
      key: "archive",
      header: t("columns.archive"),
      accessor: (row) => {
        const isArchived = row?.archive;
        return (
          <Badge variant={isArchived ? "default" : "outline"}>
            {isArchived ? t("archive.archived") : t("archive.not_archived")}
          </Badge>
        );
      },
    },
    {
      key: "report",
      header: t("columns.report"),
      accessor: (row) => {
        if (row?.report_filename || row?.report) {
          const filename = row.report_filename || "Просмотреть отчет";
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
    { label: t("breadcrumbs.home"), href: "/" },
    { label: t("breadcrumbs.current"), current: true },
  ];

  const delayTypeOptions = useMemo(() => {
    const options = [{ value: "", label: t("filters.delay_type_all") }];
    DELAY_TYPE_OPTIONS.forEach((type) =>
      options.push({
        value: type.value,
        label: getDelayTypeLabel(type.value),
      }),
    );
    return options;
  }, [t]);

  const stationOptions = useMemo(() => {
    const options = [{ value: "", label: t("filters.station_placeholder") }];
    STATION_OPTIONS.forEach((station) =>
      options.push({
        value: station.value,
        label: station.label,
      }),
    );
    return options;
  }, []);

  const organizationOptions = useMemo(() => {
    const options = [
      { value: "", label: t("filters.responsible_org_placeholder") },
    ];
    if (organizationsData) {
      organizationsData?.forEach((org) =>
        options.push({
          value: String(org.id),
          label: org.name,
        }),
      );
    }
    return options;
  }, [organizationsData]);

  const statusOptions = [
    { value: "", label: t("filters.status_all") },
    { value: "true", label: t("filters.status_disruption") },
    { value: "false", label: t("filters.status_no_disruption") },
  ];

  const trainTypeOptions = useMemo(() => {
    const options = [{ value: "", label: t("filters.train_type_placeholder") }];
    TRAIN_TYPE_OPTIONS.forEach((type) =>
      options.push({
        value: type.value,
        label: getTrainTypeLabel(type.value),
      }),
    );
    return options;
  }, [t]);

  const groupReasonOptions = useMemo(() => {
    const options = [
      { value: "", label: t("filters.group_reason_placeholder") },
    ];
    GROUP_REASON_OPTIONS.forEach((reason) =>
      options.push({
        value: reason.value,
        label: getGroupReasonLabel(reason.value),
      }),
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
              name: "delay_type",
              label: t("filters.delay_type"),
              isSelect: true,
              options: delayTypeOptions,
              placeholder: t("filters.delay_type_placeholder"),
              searchable: false,
              loading: false,
            },
            {
              name: "train_type",
              label: t("filters.train_type"),
              isSelect: true,
              options: trainTypeOptions,
              placeholder: t("filters.train_type_placeholder"),
              searchable: false,
              loading: false,
            },
            {
              name: "group_reason",
              label: t("filters.group_reason"),
              isSelect: true,
              options: groupReasonOptions,
              placeholder: t("filters.group_reason_placeholder"),
              searchable: false,
              loading: false,
            },
            {
              name: "station",
              label: t("filters.station"),
              isSelect: true,
              options: stationOptions,
              placeholder: t("filters.station_placeholder"),
              searchable: true,
              loading: false,
              permission: "filter_delay_station",
            },
            {
              name: "responsible_org",
              label: t("filters.responsible_org"),
              isSelect: true,
              options: organizationOptions,
              placeholder: t("filters.responsible_org_placeholder"),
              searchable: false,
              loading: isLoadingOrganizations,
            },
            {
              name: "status",
              label: t("filters.status"),
              isSelect: true,
              options: statusOptions,
              placeholder: t("filters.status_placeholder"),
              searchable: false,
              loading: false,
            },
          ]}
          hasSearch={false}
          hasDateRangePicker
          dateRangePickerLabel=""
          searchPlaceholder={t("filters.search_placeholder")}
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
          emptyTitle={t("empty.title")}
          emptyDescription={t("empty.description")}
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
