"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { PageHeader } from "@/ui/page-header";
import { Button } from "@/ui/button";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import { EmptyState } from "@/ui/empty-state";
import { useSnackbar } from "@/providers/snackbar-provider";
import { cn } from "@/lib/utils";
import { canAccessSection, hasPermission } from "@/lib/permissions";
import { authService } from "@/api/services/auth.service";

import { useGetLocomotiveDetail } from "@/api/hooks/use-locomotives";
import { useInspectionTypes } from "@/api/hooks/use-inspection";
import {
  useTU152JournalInfinite,
  useCreateTU152Journal,
  useUpdateTU152Journal,
  useDeleteTU152Journal,
} from "@/api/hooks/use-tu152-journal";
import {
  CombinedJournalEntry,
  CombinedJournalPayload,
} from "@/api/types/tu152-journal";

import UnauthorizedPage from "../../unauthorized/page";
import { Tu152JournalModal } from "../components/tu152-journal-modal";
import { RailwayStamp } from "../components/railway-stamp";

type TabKey = "energy" | "fire" | "camera" | "stamp" | "revision";

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (isNaN(d.getTime())) return value;
    return format(d, "dd.MM.yyyy");
  } catch {
    return value;
  }
}

function fmtDateTime(value?: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return format(d, "dd.MM.yyyy HH:mm");
  } catch {
    return value;
  }
}

function entrySortDate(e: CombinedJournalEntry): number {
  const candidates = [
    e.revision_journal?.date,
    e.energy_type?.date_of_receipt,
    e.stamp?.stamp_applied_at,
    e.created_time,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c.length === 10 ? `${c}T00:00:00` : c).getTime();
    if (!isNaN(d)) return d;
  }
  return 0;
}

export default function Tu152LocomotiveHandbookPage() {
  const t = useTranslations("Tu152JournalDetail");
  const tList = useTranslations("Tu152JournalPage");
  const params = useParams();
  const { showSuccess, showError } = useSnackbar();

  const currentUser = authService.getUser();
  if (!currentUser || !canAccessSection(currentUser, "tu152-journal")) {
    return <UnauthorizedPage />;
  }

  const canEdit = hasPermission(currentUser, "edit_tu152_journal");
  const canDelete = hasPermission(currentUser, "delete_tu152_journal");
  const canCreate = hasPermission(currentUser, "create_tu152_journal");
  const branchName = (currentUser.branch as { name?: string } | undefined)?.name;

  const locomotiveId = Number(params.locomotiveId);

  const { data: locomotive, isPending: loadingLoco } = useGetLocomotiveDetail(
    locomotiveId,
    Number.isFinite(locomotiveId),
  );

  const { data: inspectionTypesData } = useInspectionTypes(true);

  const {
    data: infiniteData,
    isLoading,
    error: apiError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTU152JournalInfinite({ locomotive_id: locomotiveId }, 10);

  const createMutation = useCreateTU152Journal();
  const updateMutation = useUpdateTU152Journal();
  const deleteMutation = useDeleteTU152Journal();

  const inspectionTypeMap = useMemo(() => {
    const map = new Map<number, string>();
    (inspectionTypesData ?? []).forEach((ins) =>
      map.set(ins.id, ins.name_uz || ins.name),
    );
    return map;
  }, [inspectionTypesData]);

  const entries = useMemo(() => {
    const list =
      infiniteData?.pages.flatMap((p) => p.results ?? []) ?? [];
    return [...list].sort((a, b) => entrySortDate(b) - entrySortDate(a));
  }, [infiniteData]);

  const totalCount = infiniteData?.pages[0]?.count ?? entries.length;

  // Intersection observer sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, entries.length]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CombinedJournalEntry | undefined>(
    undefined,
  );
  const [modalTab, setModalTab] = useState<TabKey>("energy");
  const [pendingDelete, setPendingDelete] = useState<
    CombinedJournalEntry | undefined
  >(undefined);

  const handleAdd = useCallback(() => {
    setEditEntry(undefined);
    setModalTab("energy");
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback(
    (row: CombinedJournalEntry, tab: TabKey = "energy") => {
      setEditEntry(row);
      setModalTab(tab);
      setIsModalOpen(true);
    },
    [],
  );

  const handleSave = useCallback(
    (payload: CombinedJournalPayload) => {
      if (editEntry) {
        updateMutation.mutate(
          { id: editEntry.id, payload },
          {
            onSuccess: () => {
              showSuccess(tList("success_update"));
              setIsModalOpen(false);
              setEditEntry(undefined);
            },
            onError: (err: any) => {
              showError(
                tList("error_title"),
                err?.response?.data?.message ||
                  err?.message ||
                  tList("error_update"),
              );
            },
          },
        );
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => {
            showSuccess(tList("success_create"));
            setIsModalOpen(false);
          },
          onError: (err: any) => {
            showError(
              tList("error_title"),
              err?.response?.data?.message ||
                err?.message ||
                tList("error_create"),
            );
          },
        });
      }
    },
    [editEntry, createMutation, updateMutation, showSuccess, showError, tList],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      showSuccess(tList("success_delete"));
      setPendingDelete(undefined);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || tList("error_delete");
      showError(tList("error_title"), message);
    }
  }, [pendingDelete, deleteMutation, showSuccess, showError, tList]);

  const locomotiveLabel = locomotive
    ? `${locomotive.name}${locomotive.model_name ? " · " + locomotive.model_name : ""}`
    : undefined;

  if (loadingLoco) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">{tList("loading")}</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t("hero_label")} />

      <div className="pb-8">
        {/* Locomotive line + add button */}
        <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-slate-800 truncate">
              {locomotive?.name ?? `#${locomotiveId}`}
              {locomotive?.model_name && (
                <span className="ml-2 font-normal text-slate-500 text-base">
                  {locomotive.model_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canCreate && (
              <Button size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" />
                {t("add_entry")}
              </Button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">{tList("loading")}</span>
          </div>
        )}

        {apiError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{(apiError as any)?.message || tList("error_load")}</span>
          </div>
        )}

        {!isLoading && !apiError && entries.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <EmptyState
              title={t("entries_empty_title")}
              description={t("entries_empty_desc")}
            />
          </div>
        )}

        {!isLoading && !apiError && entries.length > 0 && (
          <>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  inspectionTypeMap={inspectionTypeMap}
                  branchName={branchName}
                  onEdit={canEdit ? (tab) => handleEdit(entry, tab) : undefined}
                  onDelete={canDelete ? () => setPendingDelete(entry) : undefined}
                  t={t}
                />
              ))}
            </div>

            {/* Infinite-scroll sentinel + loader */}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-xs">{tList("loading")}</span>
              </div>
            )}
            {!hasNextPage && entries.length >= 10 && (
              <div className="py-3 text-center text-[11px] text-slate-400">
                {t("entries_loaded_all", { count: totalCount })}
              </div>
            )}
          </>
        )}
      </div>

      <Tu152JournalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditEntry(undefined);
        }}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
        editData={editEntry}
        branchName={branchName}
        lockedLocomotiveId={editEntry ? undefined : locomotiveId}
        lockedLocomotiveLabel={locomotiveLabel}
        defaultTab={modalTab}
      />

      <ConfirmationDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(undefined)}
        onConfirm={confirmDelete}
        title={tList("delete_confirm_title")}
        message={tList("delete_confirm_message")}
        confirmText={tList("delete_confirm")}
        cancelText={tList("delete_cancel")}
        variant="danger"
        isDoingAction={deleteMutation.isPending}
        isDoingActionText={tList("deleting")}
      />
    </>
  );
}

function EntryRow({
  entry,
  inspectionTypeMap,
  branchName,
  onEdit,
  onDelete,
  t,
}: {
  entry: CombinedJournalEntry;
  inspectionTypeMap: Map<number, string>;
  branchName?: string;
  onEdit?: (tab: TabKey) => void;
  onDelete?: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const e = entry.energy_type;
  const fire = entry.fire_extinguisher;
  const cam = entry.camera_receipt;
  const stamp = entry.stamp;
  const rev = entry.revision_journal;

  // Pick a representative date for the header
  const headerDate =
    rev?.date ??
    e?.date_of_receipt ??
    stamp?.stamp_applied_at ??
    entry.created_time;

  return (
    <div className="px-3 md:px-4 py-3">
      {/* Header line */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">#{entry.id}</span>
          <span className="text-slate-700 font-medium">
            {fmtDate(headerDate)}
          </span>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-0.5 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit("energy")}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
                aria-label={t("edit")}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-red-600"
                aria-label={t("delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-blocks (only filled ones rendered) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {e && (
          <Block
            label={
              e.type_of_journal === "FUEL"
                ? t("block_energy_fuel")
                : e.type_of_journal === "ELECTRICITY"
                  ? t("block_energy_electricity")
                  : t("block_energy")
            }
          >
            <Field label={t("col_amount")}>
              {e.type_of_journal === "FUEL" && e.weight_of_fuel != null
                ? `${e.weight_of_fuel} ${t("unit_kg")}`
                : e.type_of_journal === "ELECTRICITY" &&
                    e.kv_electricity != null
                  ? `${e.kv_electricity} ${t("unit_kv")}`
                  : "—"}
            </Field>
            <Field label={t("col_date")}>{fmtDate(e.date_of_receipt)}</Field>
            <Field label={t("col_receiver")}>{e.receiver || "—"}</Field>
            <Field label={t("col_sender")}>{e.sender || "—"}</Field>
          </Block>
        )}

        {fire && (
          <Block label={t("block_fire")}>
            <Field label={t("col_name")}>{fire.name || "—"}</Field>
            <Field label={t("col_count")}>{fire.count ?? "—"}</Field>
            <Field label={t("col_receiver")}>{fire.receiver || "—"}</Field>
            <Field label={t("col_sender")}>{fire.sender || "—"}</Field>
          </Block>
        )}

        {cam && (
          <Block label={t("block_camera")}>
            <Field label={t("col_name")}>{cam.name || "—"}</Field>
            <Field label={t("col_count")}>{cam.count ?? "—"}</Field>
            <Field label={t("col_receiver")}>{cam.receiver || "—"}</Field>
            <Field label={t("col_sender")}>{cam.sender || "—"}</Field>
          </Block>
        )}

        {stamp && (
          <Block label={t("block_stamp")} className="md:col-span-2">
            {(stamp.red_stamp || stamp.green_stamp) ? (
              <div className="col-span-2 flex justify-center py-2">
                <RailwayStamp
                  variant={stamp.red_stamp ? "red" : "green"}
                  date={stamp.stamp_applied_at}
                  branchName={branchName}
                  className="w-64 sm:w-72"
                />
              </div>
            ) : (
              <Field label={t("col_date")}>
                {fmtDate(stamp.stamp_applied_at)}
              </Field>
            )}
          </Block>
        )}

        {rev && (
          <Block label={t("block_revision")} className="md:col-span-2">
            <Field label={t("col_inspection")}>
              {rev.inspection_type
                ? inspectionTypeMap.get(rev.inspection_type) ??
                  `#${rev.inspection_type}`
                : "—"}
            </Field>
            <Field label={t("col_driver")}>{rev.train_driver || "—"}</Field>
            <Field label={t("col_table_no")}>{rev.table_number || "—"}</Field>
            <Field label={t("col_code")}>{rev.code || "—"}</Field>
            <Field label={t("col_datetime")}>{fmtDateTime(rev.date)}</Field>
            {rev.issue && (
              <div className="col-span-2 mt-1">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">
                  {t("col_issue")}
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                  {rev.issue}
                </div>
              </div>
            )}
          </Block>
        )}

        {!e && !fire && !cam && !stamp && !rev && (
          <div className="text-xs text-slate-400 italic">{t("entry_empty")}</div>
        )}
      </div>
    </div>
  );
}

function Block({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
        {label}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1">{children}</dl>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </>
  );
}
