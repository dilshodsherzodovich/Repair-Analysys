"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import PageFilters from "@/ui/filters";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import {
  usePantographJournal,
  useCreatePantographEntry,
  useUpdatePantographEntry,
  useDeletePantographEntry,
} from "@/api/hooks/use-pantograph";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useOrganizations } from "@/api/hooks/use-organizations";
import {
  PantographJournalEntry,
  CreatePantographJournalPayload,
  UpdatePantographJournalPayload,
} from "@/api/types/pantograph";
import { responsibleOrganizations } from "@/data";
import { PantographModal } from "@/components/pantograph/pantograph-modal";
import { useSnackbar } from "@/providers/snackbar-provider";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "./unauthorized/page";
import type { FiltersQuery } from "@/ui/filters";

export default function PantografPage() {
  const t = useTranslations("PantographPage");
  const { updateQuery, getAllQueryValues, getQueryValue } = useFilterParams();

  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  if (!currentUser || !canAccessSection(currentUser, "pantograf")) {
    return <UnauthorizedPage />;
  }

  const { q, page, pageSize, tab, locomotive, organization, department } = getAllQueryValues();

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [currentTab, setCurrentTab] = useState<string>(tab || "all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEntry, setSelectedEntry] =
    useState<PantographJournalEntry | null>(null);

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const { data: locomotivesData, isPending: loadingLocomotives } =
    useGetLocomotives(true, undefined, { no_page: true });
  const { data: organizationsData, isLoading: loadingOrganizations } =
    useOrganizations();

  const locomotiveOptions = useMemo(() => {
    if (!locomotivesData?.results) return [];
    return locomotivesData.results.map((loc) => ({
      label: `${loc.name} (${loc.model_name ?? ""})`,
      value: loc.name ?? "",
    }));
  }, [locomotivesData]);

  const organizations = useMemo(() => {
    if (!organizationsData) return [];
    if (Array.isArray(organizationsData)) return organizationsData;
    const res = (organizationsData as unknown as { results?: { id: number; name: string }[] })?.results;
    return res ?? [];
  }, [organizationsData]);

  const pageFilters = useMemo((): FiltersQuery[] => [
    {
      name: "locomotive",
      label: t("filter_locomotive"),
      isSelect: true,
      options: [
        { label: t("filter_all"), value: "" },
        ...locomotiveOptions,
      ],
      placeholder: t("filter_all"),
      searchable: true,
      clearable: true,
      loading: loadingLocomotives,
    },
    {
      name: "organization",
      label: t("filter_organization"),
      isSelect: true,
      options: [
        { label: t("filter_all"), value: "" },
        ...organizations.map((org: { id: number; name: string }) => ({
          label: org.name,
          value: String(org.id),
        })),
      ],
      placeholder: t("filter_all"),
      searchable: true,
      clearable: true,
      loading: loadingOrganizations,
      permission: "choose_organization",
    },
    {
      name: "department",
      label: t("filter_department"),
      isSelect: true,
      options: [
        { label: t("filter_all"), value: "" },
        ...responsibleOrganizations.map((d) => ({ label: d, value: d })),
      ],
      placeholder: t("filter_all"),
      searchable: true,
      clearable: true,
    },
  ], [locomotiveOptions, organizations, loadingLocomotives, loadingOrganizations, t]);

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = usePantographJournal({
    page: currentPage,
    page_size: itemsPerPage,
    search: q || locomotive || organization || department,
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
            t("errors.load")
        )
    : null;


  const handleEdit = (row: PantographJournalEntry) => {
    setSelectedEntry(row);
    setModalMode("edit"); 
    setIsModalOpen(true);
  };

  const handleDelete = async (row: PantographJournalEntry) => {
    try {
      await deleteEntryMutation.mutateAsync(row.id);
      showSuccess(t("messages.delete_success"));
    } catch (error: any) {
      showError(
        t("errors.generic"),
        error?.response?.data?.message ||
          error?.message ||
          t("errors.delete")
      );
      throw error;
    }
  };

  const handleCreate = () => {
    setSelectedEntry(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleSave = (
    (
      payload: CreatePantographJournalPayload | UpdatePantographJournalPayload
    ) => {
      if (modalMode === "create") {
        createEntryMutation.mutate(payload as CreatePantographJournalPayload, {
          onSuccess: () => {
            showSuccess(t("messages.create_success"));
            setIsModalOpen(false);
            setSelectedEntry(null);
          },
          onError: (error: any) => {
            showError(
              t("errors.generic"),
              error?.response?.data?.message ||
                error?.message ||
                t("errors.create")
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
              showSuccess(t("messages.update_success"));
              setIsModalOpen(false);
              setSelectedEntry(null);
            },
            onError: (error: any) => {
              showError(
                t("errors.generic"),
                error?.response?.data?.message ||
                  error?.message ||
                  t("errors.update")
              );
            },
          }
        );
      }
    }
  );

  const handleModalClose = (() => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  });

  const isModalPending = useMemo(
    () => createEntryMutation.isPending || updateEntryMutation.isPending,
    [createEntryMutation.isPending, updateEntryMutation.isPending]
  );

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
      header: t("columns.date"),
      accessor: (row) => formatDate(row.date),
    },
    {
      key: "locomotive_info",
      header: t("columns.locomotive"),
      accessor: (row) =>
        row.locomotive_info
          ? `${row.locomotive_info.name} (${row.locomotive_info.locomotive_model})`
          : "-",
    },
    {
      key: "department",
      header: t("columns.department"),
      accessor: (row) => row.department,
    },
    {
      key: "section",
      header: t("columns.section"),
      accessor: (row) => (
        <div className="max-w-[300px]">
          <div className="whitespace-normal break-words">{row.section}</div>
        </div>
      ),
    },
    {
      key: "organization_info",
      header: t("columns.organization"),
      accessor: (row) => row.organization_info?.name || "-",
    },
    {
      key: "description",
      header: t("columns.description"),
      accessor: (row) => (
        <div className="max-w-[400px]">
          <div className="whitespace-normal break-words">{row.description}</div>
        </div>
      ),
    },
    {
      key: "damage",
      header: t("columns.damage"),
      accessor: (row) => formatDamage(row.damage),
    },
  ];

  const breadcrumbs = [
    { label: t("breadcrumbs.home"), href: "/" },
    { label: t("breadcrumbs.current"), current: true },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-4">
        <PageFilters
          filters={pageFilters}
          hasSearch={true}
          searchPlaceholder={t("search_placeholder")}
          onAdd={handleCreate}
          addButtonText={t("add_button")}
          addButtonPermittion="create_pantograf"
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
          updateQueryParams={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteEntryMutation.isPending}
          selectable={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyTitle={t("empty_title")}
          emptyDescription={t("empty_description")}
        />
      </div>

      <PantographModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        entry={selectedEntry}
        mode={modalMode}
        isPending={isModalPending}
      />
    </div>
  );
}
