"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Fuel,
  Flame,
  Camera,
  Stamp,
  ClipboardList,
} from "lucide-react";

import PageFilters from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { getPageCount } from "@/lib/utils";
import { canAccessSection } from "@/lib/permissions";
import { authService } from "@/api/services/auth.service";
import { useSnackbar } from "@/providers/snackbar-provider";

import {
  useTU152JournalList,
  useCreateTU152Journal,
  useUpdateTU152Journal,
  useDeleteTU152Journal,
} from "@/api/hooks/use-tu152-journal";
import {
  CombinedJournalEntry,
  CombinedJournalPayload,
} from "@/api/types/tu152-journal";

import UnauthorizedPage from "../unauthorized/page";
import { Tu152JournalModal } from "./components/tu152-journal-modal";

const PAGE_SIZE_DEFAULT = 10;

function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (isNaN(d.getTime())) return value;
    return format(d, "dd.MM.yyyy");
  } catch {
    return value;
  }
}

export default function Tu152JournalPage() {
  const t = useTranslations("Tu152JournalPage");
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useSnackbar();

  const currentUser = authService.getUser();
  if (!currentUser || !canAccessSection(currentUser, "tu152-journal")) {
    return <UnauthorizedPage />;
  }

  const organizationId = currentUser.branch?.organization?.id;

  const { q, page, pageSize } = Object.fromEntries(searchParams.entries());
  const dateFrom = searchParams.get("date_from") || undefined;
  const dateTo = searchParams.get("date_to") || undefined;

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : PAGE_SIZE_DEFAULT;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CombinedJournalEntry | undefined>(
    undefined,
  );

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useTU152JournalList({
    page: currentPage,
    page_size: itemsPerPage,
    search: q,
    organization: organizationId,
    date_from: dateFrom,
    date_to: dateTo,
  });

  const createMutation = useCreateTU152Journal();
  const updateMutation = useUpdateTU152Journal();
  const deleteMutation = useDeleteTU152Journal();

  const rows = apiResponse?.results ?? [];
  const totalItems = apiResponse?.count ?? 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;

  const error = apiError
    ? apiError instanceof Error
      ? apiError
      : new Error((apiError as any)?.message || t("error_load"))
    : null;

  const handleCreate = useCallback(() => {
    setEditEntry(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((row: CombinedJournalEntry) => {
    setEditEntry(row);
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(
    (payload: CombinedJournalPayload) => {
      if (editEntry) {
        updateMutation.mutate(
          { id: editEntry.id, payload },
          {
            onSuccess: () => {
              showSuccess(t("success_update"));
              setIsModalOpen(false);
              setEditEntry(undefined);
            },
            onError: (err: any) => {
              showError(
                t("error_title"),
                err?.response?.data?.message ||
                  err?.message ||
                  t("error_update"),
              );
            },
          },
        );
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => {
            showSuccess(t("success_create"));
            setIsModalOpen(false);
          },
          onError: (err: any) => {
            showError(
              t("error_title"),
              err?.response?.data?.message ||
                err?.message ||
                t("error_create"),
            );
          },
        });
      }
    },
    [editEntry, createMutation, updateMutation, showSuccess, showError, t],
  );

  const handleDelete = useCallback(
    async (row: CombinedJournalEntry) => {
      try {
        await deleteMutation.mutateAsync(row.id);
        showSuccess(t("success_delete"));
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || t("error_delete");
        showError(t("error_title"), message);
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [deleteMutation, showSuccess, showError, t],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditEntry(undefined);
  }, []);

  const columns: TableColumn<CombinedJournalEntry>[] = useMemo(
    () => [
      {
        key: "id",
        header: t("columns.id"),
        accessor: (row) => (
          <span className="text-slate-400 font-medium">#{row.id}</span>
        ),
        width: "70px",
      },
      {
        key: "locomotive",
        header: t("columns.locomotive"),
        accessor: (row) => (
          <div>
            <div className="font-semibold text-slate-700">
              {row.locomotive_info?.name ?? `#${row.locomotive_id}`}
            </div>
            {row.locomotive_info?.model_name && (
              <div className="text-xs text-slate-400">
                {row.locomotive_info.model_name}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "journals",
        header: t("columns.filled_blocks"),
        accessor: (row) => (
          <div className="flex items-center gap-2 flex-wrap">
            <JournalIndicator
              icon={<Fuel className="h-3.5 w-3.5" />}
              filled={Boolean(row.energy_type)}
              label={t("block_energy")}
            />
            <JournalIndicator
              icon={<Flame className="h-3.5 w-3.5" />}
              filled={Boolean(row.fire_extinguisher)}
              label={t("block_fire")}
            />
            <JournalIndicator
              icon={<Camera className="h-3.5 w-3.5" />}
              filled={Boolean(row.camera_receipt)}
              label={t("block_camera")}
            />
            <JournalIndicator
              icon={<Stamp className="h-3.5 w-3.5" />}
              filled={Boolean(row.stamp)}
              label={t("block_stamp")}
            />
            <JournalIndicator
              icon={<ClipboardList className="h-3.5 w-3.5" />}
              filled={Boolean(row.revision_journal)}
              label={t("block_revision")}
            />
          </div>
        ),
      },
      {
        key: "energy",
        header: t("columns.energy"),
        accessor: (row) => {
          if (!row.energy_type) return <span className="text-slate-400">—</span>;
          const type = row.energy_type.type_of_journal;
          if (type === "FUEL")
            return (
              <span>
                {row.energy_type.weight_of_fuel ?? "—"}{" "}
                <span className="text-xs text-slate-400">{t("unit_kg")}</span>
              </span>
            );
          if (type === "ELECTRICITY")
            return (
              <span>
                {row.energy_type.kv_electricity ?? "—"}{" "}
                <span className="text-xs text-slate-400">{t("unit_kv")}</span>
              </span>
            );
          return <span className="text-slate-400">—</span>;
        },
      },
      {
        key: "revision_driver",
        header: t("columns.train_driver"),
        accessor: (row) => row.revision_journal?.train_driver ?? "—",
      },
      {
        key: "created_time",
        header: t("columns.created_time"),
        accessor: (row) => formatDate(row.created_time),
        width: "120px",
      },
    ],
    [t],
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="mt-4">
        <PageFilters
          filters={[]}
          hasSearch={true}
          searchPlaceholder={t("search_placeholder")}
          hasDateRangePicker={true}
          dateRangeStartKey="date_from"
          dateRangeEndKey="date_to"
          dateRangePickerLabel={t("date_range_label")}
          addButtonText={t("add_button")}
          addButtonPermittion="create_tu152_journal"
          onAdd={handleCreate}
        />
      </div>

      <div className="mt-6">
        <PaginatedTable<CombinedJournalEntry>
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          error={error}
          totalPages={totalPages}
          totalItems={totalItems}
          updateQueryParams={true}
          showActions={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          editPermission="edit_tu152_journal"
          deletePermission="delete_tu152_journal"
          isDeleting={deleteMutation.isPending}
          emptyTitle={t("empty_title")}
          emptyDescription={t("empty_description")}
        />
      </div>

      <Tu152JournalModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
        editData={editEntry}
        organizationId={organizationId}
      />
    </>
  );
}

function JournalIndicator({
  icon,
  filled,
  label,
}: {
  icon: React.ReactNode;
  filled: boolean;
  label: string;
}) {
  return (
    <span
      className={
        filled
          ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200"
          : "inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-200"
      }
      title={label}
    >
      {filled ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
