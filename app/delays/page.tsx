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
  DelayStage,
  DelayCreatePayload,
  DelayUpdatePayload,
  UploadProtocolPayload,
  DELAY_TYPE_OPTIONS,
  TRAIN_TYPE_OPTIONS,
  GROUP_REASON_OPTIONS,
  DELAY_STAGE_VALUES,
} from "@/api/types/delays";
import {
  useCreateDelay,
  useDelays,
  useDeleteDelay,
  useUpdateDelay,
  useAcceptDelay,
  useUploadProtocol,
  useClassifyDelay,
  useUnclassifyDelay,
} from "@/api/hooks/use-delays";
import { delaysService } from "@/api/services/delays.service";
import { DelayModal } from "@/components/delays/delay-modal";
import { CulpritsListModal } from "@/components/culprits/culprits-list-modal";
import { UploadProtocolModal } from "@/components/delays/upload-protocol-modal";
import { DelayTimelineModal } from "@/components/delays/delay-timeline-modal";
import { RecoveryInfoModal } from "@/components/delays/recovery-info-modal";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import { useSnackbar } from "@/providers/snackbar-provider";
import {
  canAccessSection,
  hasPermission,
  type Permission,
} from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import {
  FileUp,
  FilePen,
  Edit,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Undo2,
  ClipboardCheck,
  History,
  Users,
  Clock,
  CornerDownRight,
  Archive,
  Info,
  FileSpreadsheet,
} from "lucide-react";
import { useTranslations } from "next-intl";

// Stages that still have a "next" awaited step (terminal stages excluded)
const STAGES_WITH_NEXT: DelayStage[] = [
  "created",
  "accepted",
  "protocol_uploaded",
  "disruption",
  "payroll_confirmed",
];

export default function DelaysPage() {
  const t = useTranslations("DelaysPage");
  const { getAllQueryValues } = useFilterParams();
  const {
    q,
    page,
    pageSize,
    delay_type,
    start_date,
    end_date,
    responsible_org,
    station,
    mashinist,
    locomotiv,
    stage,
    protocol_overdue,
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
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEntry, setSelectedEntry] = useState<DelayEntry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<DelayEntry | null>(null);

  const [isCulpritsModalOpen, setIsCulpritsModalOpen] = useState(false);
  const [culpritsEntry, setCulpritsEntry] = useState<DelayEntry | null>(null);

  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [protocolEntry, setProtocolEntry] = useState<DelayEntry | null>(null);

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineEntry, setTimelineEntry] = useState<DelayEntry | null>(null);

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoEntry, setInfoEntry] = useState<DelayEntry | null>(null);

  const [classifyTarget, setClassifyTarget] = useState<{
    row: DelayEntry;
    isDisruption: boolean;
  } | null>(null);
  const [unclassifyTarget, setUnclassifyTarget] = useState<DelayEntry | null>(
    null
  );

  const createMutation = useCreateDelay();
  const updateMutation = useUpdateDelay();
  const deleteMutation = useDeleteDelay();
  const acceptMutation = useAcceptDelay();
  const uploadProtocolMutation = useUploadProtocol();
  const classifyMutation = useClassifyDelay();
  const unclassifyMutation = useUnclassifyDelay();

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives();

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const isModerator = hasPermission(currentUser, "upload_delay_report");
  const canManageCulprits = hasPermission(currentUser, "manage_culprits");
  const canExport = hasPermission(currentUser, "export_sriv_delays");

  const stageFilter = (stage as DelayStage) || undefined;
  const archiveFilter =
    archive === "true" ? true : archive === "false" ? false : undefined;

  const getTrainTypeLabel = (value?: string | null) =>
    value ? t(`train_types.${value}` as any) : "-";

  const getGroupReasonLabel = (value?: string | null) => {
    if (!value) return "-";
    const option = GROUP_REASON_OPTIONS.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const getDelayTypeLabel = (value?: string | null) =>
    value ? t(`delay_types.${value}` as any) : "-";

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
    mashinist: mashinist || undefined,
    locomotiv: locomotiv || undefined,
    responsible_org: responsible_org || undefined,
    stage: stageFilter,
    protocol_overdue: protocol_overdue === "true" ? true : undefined,
    archive: archiveFilter,
    from_date: start_date || undefined,
    end_date: end_date || undefined,
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

  const actionError = useCallback(
    (e: any) =>
      showError(
        t("messages.action_error_title"),
        e?.response?.data?.detail ||
          e?.response?.data?.message ||
          e?.message ||
          t("messages.action_error_message")
      ),
    [showError, t]
  );

  const handleEdit = useCallback((row: DelayEntry) => {
    if (row.archive) return;
    setSelectedEntry(row);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedEntry(null);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await delaysService.exportDelaysXlsx({
        search: q,
        delay_type: delay_type as any,
        station: station || undefined,
        responsible_org: responsible_org || undefined,
        stage: stageFilter,
        protocol_overdue: protocol_overdue === "true" ? true : undefined,
        archive: archiveFilter,
        from_date: start_date || undefined,
        end_date: end_date || undefined,
        train_type: train_type || undefined,
        group_reason: group_reason || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sriv_delays_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      showError(
        t("messages.action_error_title"),
        e?.response?.data?.detail ||
          e?.message ||
          t("messages.action_error_message")
      );
    } finally {
      setIsExporting(false);
    }
  }, [
    q,
    delay_type,
    station,
    responsible_org,
    stageFilter,
    protocol_overdue,
    archiveFilter,
    start_date,
    end_date,
    train_type,
    group_reason,
    showError,
    t,
  ]);

  const handleSave = useCallback(
    (payload: DelayCreatePayload | DelayUpdatePayload) => {
      if (modalMode === "create") {
        createMutation.mutate(payload as DelayCreatePayload, {
          onSuccess: () => {
            showSuccess(t("messages.create_success"));
            setIsModalOpen(false);
            setSelectedEntry(null);
          },
          onError: (e: any) =>
            showError(
              t("messages.create_error_title"),
              e?.response?.data?.message ||
                e?.message ||
                t("messages.create_error_message")
            ),
        });
      } else if (selectedEntry) {
        updateMutation.mutate(
          { id: selectedEntry.id, payload: payload as DelayUpdatePayload },
          {
            onSuccess: () => {
              showSuccess(t("messages.update_success"));
              setIsModalOpen(false);
              setSelectedEntry(null);
            },
            onError: (e: any) =>
              showError(
                t("messages.update_error_title"),
                e?.response?.data?.message ||
                  e?.message ||
                  t("messages.update_error_message")
              ),
          }
        );
      }
    },
    [modalMode, selectedEntry, createMutation, updateMutation, showSuccess, showError, t]
  );

  const handleDeleteClick = useCallback((row: DelayEntry) => {
    if (row.archive) return;
    setDeleteEntry(row);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteEntry) return;
    try {
      await deleteMutation.mutateAsync(deleteEntry.id);
      showSuccess(t("messages.delete_success"));
      setIsDeleteModalOpen(false);
      setDeleteEntry(null);
    } catch (e: any) {
      showError(
        t("messages.delete_error_title"),
        e?.response?.data?.message ||
          e?.message ||
          t("messages.delete_error_message")
      );
    }
  }, [deleteEntry, deleteMutation, showError, showSuccess, t]);

  const handleAccept = useCallback(
    (row: DelayEntry) => {
      acceptMutation.mutate(row.id, {
        onSuccess: () => showSuccess(t("messages.accept_success")),
        onError: actionError,
      });
    },
    [acceptMutation, showSuccess, t, actionError]
  );

  const handleOpenProtocol = useCallback((row: DelayEntry) => {
    setProtocolEntry(row);
    setIsProtocolModalOpen(true);
  }, []);

  const handleProtocolSave = useCallback(
    (payload: UploadProtocolPayload) => {
      if (!protocolEntry) return;
      uploadProtocolMutation.mutate(
        { id: protocolEntry.id, payload },
        {
          onSuccess: () => {
            showSuccess(t("messages.upload_protocol_success"));
            setIsProtocolModalOpen(false);
            setProtocolEntry(null);
          },
          onError: actionError,
        }
      );
    },
    [protocolEntry, uploadProtocolMutation, showSuccess, t, actionError]
  );

  const handleClassifyConfirm = useCallback(() => {
    if (!classifyTarget) return;
    classifyMutation.mutate(
      {
        id: classifyTarget.row.id,
        payload: { is_disruption: classifyTarget.isDisruption },
      },
      {
        onSuccess: () => {
          showSuccess(t("messages.classify_success"));
          setClassifyTarget(null);
        },
        onError: (e) => {
          actionError(e);
          setClassifyTarget(null);
        },
      }
    );
  }, [classifyTarget, classifyMutation, showSuccess, t, actionError]);

  const handleUnclassifyConfirm = useCallback(() => {
    if (!unclassifyTarget) return;
    unclassifyMutation.mutate(unclassifyTarget.id, {
      onSuccess: () => {
        showSuccess(t("messages.unclassify_success"));
        setUnclassifyTarget(null);
      },
      onError: (e) => {
        actionError(e);
        setUnclassifyTarget(null);
      },
    });
  }, [unclassifyTarget, unclassifyMutation, showSuccess, t, actionError]);

  const handleOpenCulprits = useCallback((row: DelayEntry) => {
    setCulpritsEntry(row);
    setIsCulpritsModalOpen(true);
  }, []);

  const handleTimeline = useCallback((row: DelayEntry) => {
    setTimelineEntry(row);
    setIsTimelineOpen(true);
  }, []);

  const handleOpenInfo = useCallback((row: DelayEntry) => {
    setInfoEntry(row);
    setIsInfoOpen(true);
  }, []);

  const getStageLabel = useCallback(
    (s?: DelayStage) => (s ? t(`stage.${s}` as any) : "-"),
    [t]
  );

  const getStageNext = useCallback(
    (s?: DelayStage) =>
      s && STAGES_WITH_NEXT.includes(s) ? t(`stage_next.${s}` as any) : null,
    [t]
  );

  const getStageVariant = useCallback((s?: DelayStage) => {
    switch (s) {
      case "disruption":
        return "destructive_outline" as const;
      case "not_disruption":
        return "success_outline" as const;
      case "payroll_confirmed":
        return "info" as const;
      case "accountant_confirmed":
        return "success" as const;
      case "protocol_uploaded":
        return "warning_outline" as const;
      case "accepted":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${String(date.getDate()).padStart(2, "0")}.${String(
        date.getMonth() + 1
      ).padStart(2, "0")}.${date.getFullYear()}`;
    } catch {
      return dateString;
    }
  }, []);

  const formatTime = useCallback((timeString: string) => {
    try {
      const match = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        return `${match[1].padStart(2, "0")}:${match[2].padStart(2, "0")}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  }, []);

  const truncateFilename = useCallback(
    (filename: string, maxLength: number = 25) => {
      if (!filename || filename.length <= maxLength) return filename;
      const lastDotIndex = filename.lastIndexOf(".");
      if (lastDotIndex === -1)
        return filename.substring(0, maxLength) + "...";
      const extension = filename.substring(lastDotIndex);
      const nameWithoutExt = filename.substring(0, lastDotIndex);
      const availableLength = maxLength - extension.length;
      if (nameWithoutExt.length <= availableLength) return filename;
      return nameWithoutExt.substring(0, availableLength) + "..." + extension;
    },
    []
  );

  const columns: TableColumn<DelayEntry>[] = [
    {
      key: "incident_date",
      header: t("columns.incident_date"),
      accessor: (row) =>
        row?.incident_date ? formatDate(row.incident_date) : "-",
    },
    {
      key: "train",
      header: t("columns.train"),
      accessor: (row) => (
        <div className="flex flex-col leading-tight">
          <span className="font-medium">{row?.train_number || "-"}</span>
          {row?.train_type && (
            <span className="text-xs text-muted-foreground">
              {getTrainTypeLabel(row.train_type)}
            </span>
          )}
        </div>
      ),
      width: "110px",
    },
    {
      key: "delay_type",
      header: t("columns.delay_type"),
      accessor: (row) => getDelayTypeLabel(row?.delay_type),
      width: "150px",
    },
    {
      key: "group_reason",
      header: t("columns.group_reason"),
      // Prefer the backend-rendered label so new codes work without a frontend map
      accessor: (row) =>
        row?.group_reason_display || getGroupReasonLabel(row?.group_reason),
    },
    {
      key: "station",
      header: t("columns.station"),
      accessor: (row) => row?.station || "-",
      width: "100px",
    },
    {
      key: "locomotiv",
      header: t("columns.locomotiv"),
      width: "130px",
      accessor: (row) => (
        <div className="flex flex-col leading-tight">
          <span className="font-medium">{row?.locomotiv_name || "-"}</span>
          {row?.mashinist && (
            <span className="text-xs text-muted-foreground">
              {row.mashinist}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "delay_time",
      header: t("columns.delay_time"),
      accessor: (row) => (row?.delay_time ? formatTime(row.delay_time) : "-"),
      width: "70px",
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
      width: "180px",
      accessor: (row) => {
        const fmt = (v: number) =>
          new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v);
        const culprits = row?.culprits ?? [];
        const totalCount = culprits.length;
        const recoveredList = culprits.filter((c) => c.recovered);
        const recoveredCount = recoveredList.length;
        // recovered zarar summasi = сумма amount причастных с recovered=true
        const recoveredSum = recoveredList.reduce(
          (sum, c) => sum + (Number(c.amount) || 0),
          0
        );
        return (
          <div className="flex flex-col gap-0.5">
            <span className="tabular-nums font-medium">
              {fmt(row?.damage_amount || 0)}
              <span className="text-muted-foreground"> / </span>
              <span className="text-success">{fmt(recoveredSum)}</span>
            </span>
            {totalCount > 0 && (
              <button
                type="button"
                onClick={() => handleOpenInfo(row)}
                className="inline-flex w-fit items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                title={t("actions.culprits")}
              >
                <Info className="h-3 w-3 shrink-0" />
                <span>
                  {t("recovery_people", {
                    rc: recoveredCount,
                    tc: totalCount,
                  })}
                </span>
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "responsible_org",
      header: t("columns.responsible_org"),
      accessor: (row) =>
        row?.responsible_org_name || row?.responsible_org_detail?.name || "-",
    },
    {
      key: "stage",
      header: t("columns.stage"),
      accessor: (row) => {
        const next = getStageNext(row?.stage);
        return (
          <div className="flex flex-col gap-1.5">
            <Badge
              variant={getStageVariant(row?.stage)}
              className="w-fit gap-1.5 font-medium"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {row?.stage_display || getStageLabel(row?.stage)}
            </Badge>

            {next && (
              <div className="flex items-center gap-1 pl-0.5 text-muted-foreground">
                <CornerDownRight className="h-3 w-3 shrink-0 opacity-50" />
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200/70">
                  <Clock className="h-3 w-3 shrink-0" />
                  {next}
                </span>
              </div>
            )}

            {row?.protocol_overdue && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 ring-1 ring-red-200">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {t("protocol_overdue")}
              </span>
            )}
          </div>
        );
      },
      width: "260px",
    },
    {
      key: "report",
      header: t("columns.report"),
      accessor: (row) => {
        const hasFile = !!(row?.report_filename || row?.report);
        if (!hasFile && !row?.protocol_number) {
          return <span className="text-gray-400">-</span>;
        }
        const filename = row.report_filename || t("columns.report");
        return (
          <div className="flex max-w-[220px] flex-col gap-0.5">
            {row?.protocol_number && (
              <span className="text-xs font-medium text-foreground">
                № {row.protocol_number}
              </span>
            )}
            {hasFile ? (
              <a
                href={row.report}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-sm text-blue-600 hover:underline"
                title={filename}
              >
                {truncateFilename(filename, 25)}
              </a>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        );
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
      options.push({ value: type.value, label: getDelayTypeLabel(type.value) })
    );
    return options;
  }, [t]);

  const organizationOptions = useMemo(() => {
    const options = [
      { value: "", label: t("filters.responsible_org_placeholder") },
    ];
    organizationsData?.forEach((org) =>
      options.push({ value: String(org.id), label: org.name })
    );
    return options;
  }, [organizationsData, t]);

  const locomotiveOptions = useMemo(() => {
    const options = [
      { value: "", label: t("filters.locomotiv_placeholder") },
    ];
    locomotivesData?.results?.forEach((loc) =>
      options.push({
        value: String(loc.id),
        label: loc.model_name ? `${loc.name} — ${loc.model_name}` : loc.name,
      })
    );
    return options;
  }, [locomotivesData, t]);

  const stageOptions = useMemo(
    () => [
      { value: "", label: t("filters.stage_all") },
      ...DELAY_STAGE_VALUES.map((s) => ({
        value: s,
        label: t(`stage.${s}` as any),
      })),
    ],
    [t]
  );

  const protocolOverdueOptions = useMemo(
    () => [
      { value: "", label: t("filters.protocol_overdue_all") },
      { value: "true", label: t("filters.protocol_overdue_only") },
    ],
    [t]
  );

  const trainTypeOptions = useMemo(() => {
    const options = [{ value: "", label: t("filters.train_type_placeholder") }];
    TRAIN_TYPE_OPTIONS.forEach((type) =>
      options.push({ value: type.value, label: getTrainTypeLabel(type.value) })
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
              name: "delay_type",
              label: t("filters.delay_type"),
              isSelect: true,
              options: delayTypeOptions,
              placeholder: t("filters.delay_type_placeholder"),
              searchable: false,
            },
            {
              name: "train_type",
              label: t("filters.train_type"),
              isSelect: true,
              options: trainTypeOptions,
              placeholder: t("filters.train_type_placeholder"),
              searchable: false,
            },
            {
              name: "group_reason",
              label: t("filters.group_reason"),
              isSelect: true,
              options: groupReasonOptions,
              placeholder: t("filters.group_reason_placeholder"),
              searchable: false,
            },
            {
              name: "station",
              label: t("filters.station"),
              isSelect: false,
              placeholder: t("filters.station_placeholder"),
              permission: "filter_delay_station",
            },
            {
              name: "mashinist",
              label: t("filters.mashinist"),
              isSelect: false,
              placeholder: t("filters.mashinist_placeholder"),
            },
            {
              name: "locomotiv",
              label: t("filters.locomotiv"),
              isSelect: true,
              options: locomotiveOptions,
              placeholder: t("filters.locomotiv_placeholder"),
              searchable: true,
              loading: isLoadingLocomotives,
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
              name: "stage",
              label: t("filters.stage"),
              isSelect: true,
              options: stageOptions,
              placeholder: t("filters.stage_placeholder"),
              searchable: false,
            },
            {
              name: "protocol_overdue",
              label: t("filters.protocol_overdue"),
              isSelect: true,
              options: protocolOverdueOptions,
              searchable: false,
            },
          ]}
          hasSearch
          hasDateRangePicker
          dateRangePickerLabel=""
          searchPlaceholder={t("filters.search_placeholder")}
          addButtonPermittion="create_delay"
          onAdd={handleCreate}
          onExport={canExport ? handleExport : undefined}
          exportButtonText={t("export_button")}
          exportButtonIcon={<FileSpreadsheet className="w-4 h-4 mr-2" />}
          exportLoading={isExporting}
          className="!mb-0"
        />
      </div>

      <div className="px-6 pb-6">
        <PaginatedTable
          columns={columns}
          data={paginatedData}
          getRowId={(row) => row.id}
          itemsPerPage={itemsPerPage}
          size="xs"
          isLoading={isLoading}
          error={error}
          totalPages={totalPages}
          totalItems={totalItems}
          updateQueryParams
          actionsDisplayMode="dropdown"
          alwaysShowKebab
          rowBadge={(row) =>
            row.archive ? (
              <span className="inline-flex -rotate-6 select-none items-center gap-1 rounded-md border-2 border-red-400/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-500/80">
                <Archive className="h-3 w-3" />
                {t("archive.archived")}
              </span>
            ) : null
          }
          extraActions={[
            // Timeline — anyone who can view delays
            {
              label: t("actions.timeline"),
              icon: <History className="h-4 w-4" />,
              onClick: handleTimeline,
              variant: "outline" as const,
            },

            // Culprits — sriv_moderator only (admin uses read-only /culprits page)
            ...(canManageCulprits
              ? [
                  {
                    label: t("actions.culprits"),
                    icon: <Users className="h-4 w-4" />,
                    onClick: handleOpenCulprits,
                    permission: "manage_culprits" as Permission,
                    variant: "outline" as const,
                  },
                ]
              : []),

            // Moderator: accept (created → accepted)
            ...(isModerator
              ? [
                  {
                    label: t("actions.accept"),
                    icon: <ClipboardCheck className="h-4 w-4" />,
                    onClick: handleAccept,
                    permission: "upload_delay_report" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) =>
                      row.stage === "created" && !row.archive,
                    className: "text-success focus:text-success",
                  },
                  // Moderator: upload protocol (accepted → protocol_uploaded)
                  {
                    label: t("actions.upload_protocol"),
                    icon: <FileUp className="h-4 w-4" />,
                    onClick: handleOpenProtocol,
                    permission: "upload_delay_report" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) =>
                      row.stage === "accepted" && !row.archive,
                  },
                  // Moderator: edit already uploaded protocol file
                  {
                    label: t("actions.edit_protocol"),
                    icon: <FilePen className="h-4 w-4" />,
                    onClick: handleOpenProtocol,
                    permission: "upload_delay_report" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) =>
                      row.stage === "protocol_uploaded" && !row.archive,
                  },
                ]
              : []),

            // Classify (protocol_uploaded → disruption | not_disruption)
            // — sriv_admin + sriv_moderator
            ...(hasPermission(currentUser, "edit_delay")
              ? [
                  {
                    label: t("actions.classify_disruption"),
                    icon: <AlertTriangle className="h-4 w-4" />,
                    onClick: (row: DelayEntry) =>
                      setClassifyTarget({ row, isDisruption: true }),
                    permission: "edit_delay" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) =>
                      row.stage === "protocol_uploaded" && !row.archive,
                    className: "text-red-600 focus:text-red-600 focus:bg-red-50",
                  },
                  {
                    label: t("actions.classify_not_disruption"),
                    icon: <ShieldCheck className="h-4 w-4" />,
                    onClick: (row: DelayEntry) =>
                      setClassifyTarget({ row, isDisruption: false }),
                    permission: "edit_delay" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) =>
                      row.stage === "protocol_uploaded" && !row.archive,
                    className: "text-success focus:text-success",
                  },
                  // Revert classification (disruption | not_disruption → protocol_uploaded)
                  {
                    label: t("actions.unclassify"),
                    icon: <Undo2 className="h-4 w-4" />,
                    onClick: (row: DelayEntry) => setUnclassifyTarget(row),
                    permission: "edit_delay" as Permission,
                    variant: "outline" as const,
                    // not_disruption is archived — allow it; disruption only if no
                    // culprit has ОТЗ/recovery confirmation (backend blocks otherwise).
                    shouldShow: (row: DelayEntry) =>
                      row.stage === "not_disruption" ||
                      (row.stage === "disruption" &&
                        !(row.culprits ?? []).some(
                          (c) => c.payroll_confirmed || c.recovered
                        )),
                  },
                ]
              : []),

            // Edit fields — sriv_admin (any org) + sriv_moderator (own org)
            ...(hasPermission(currentUser, "edit_delay")
              ? [
                  {
                    label: t("actions.edit"),
                    icon: <Edit className="h-4 w-4" />,
                    onClick: handleEdit,
                    permission: "edit_delay" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) => !row.archive,
                  },
                ]
              : []),

            // Delete (sriv_admin)
            ...(hasPermission(currentUser, "delete_delay")
              ? [
                  {
                    label: t("actions.delete"),
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: handleDeleteClick,
                    permission: "delete_delay" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: DelayEntry) => !row.archive,
                    className: "text-red-600 focus:text-red-600 focus:bg-red-50",
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

      <UploadProtocolModal
        isOpen={isProtocolModalOpen}
        onClose={() => {
          setIsProtocolModalOpen(false);
          setProtocolEntry(null);
        }}
        onSave={handleProtocolSave}
        entry={protocolEntry}
        isPending={uploadProtocolMutation.isPending}
      />

      <CulpritsListModal
        isOpen={isCulpritsModalOpen}
        onClose={() => {
          setIsCulpritsModalOpen(false);
          setCulpritsEntry(null);
        }}
        delay={culpritsEntry}
        canManage={canManageCulprits}
      />

      <DelayTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => {
          setIsTimelineOpen(false);
          setTimelineEntry(null);
        }}
        delay={timelineEntry}
      />

      <RecoveryInfoModal
        isOpen={isInfoOpen}
        onClose={() => {
          setIsInfoOpen(false);
          setInfoEntry(null);
        }}
        delay={infoEntry}
      />

      <ConfirmationDialog
        isOpen={!!classifyTarget}
        onClose={() => setClassifyTarget(null)}
        onConfirm={handleClassifyConfirm}
        title={t("messages.classify_confirm_title")}
        message={
          classifyTarget?.isDisruption
            ? t("messages.classify_confirm_message_disruption")
            : t("messages.classify_confirm_message_not_disruption")
        }
        confirmText={t("messages.classify_confirm_button")}
        cancelText={t("messages.classify_cancel_button")}
        isDoingAction={classifyMutation.isPending}
        variant={classifyTarget?.isDisruption ? "danger" : "info"}
      />

      <ConfirmationDialog
        isOpen={!!unclassifyTarget}
        onClose={() => setUnclassifyTarget(null)}
        onConfirm={handleUnclassifyConfirm}
        title={t("messages.unclassify_confirm_title")}
        message={t("messages.unclassify_confirm_message")}
        confirmText={t("messages.unclassify_confirm_button")}
        cancelText={t("messages.classify_cancel_button")}
        isDoingAction={unclassifyMutation.isPending}
        variant="warning"
      />

      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteEntry(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t("messages.delete_confirm_title")}
        message={t("messages.delete_confirm_message")}
        confirmText={t("messages.delete_confirm_button")}
        cancelText={t("messages.delete_cancel_button")}
        isDoingActionText={t("messages.delete_deleting")}
        isDoingAction={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
