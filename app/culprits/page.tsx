"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, type TableColumn } from "@/ui/paginated-table";
import PageFilters from "@/ui/filters";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import { Badge } from "@/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  canAccessSection,
  hasPermission,
  type Permission,
} from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { useOrganizations } from "@/api/hooks/use-organizations";
import {
  useCulprits,
  useUpdateCulprit,
  useDeleteCulprit,
} from "@/api/hooks/use-culprits";
import type { Culprit } from "@/api/types/culprits";
import { CulpritFormModal } from "@/components/culprits/culprit-form-modal";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import { useSnackbar } from "@/providers/snackbar-provider";

function formatAmount(amount: string | number): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!value) return "0";
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function CulpritsPage() {
  const t = useTranslations("CulpritsPage");
  const tModal = useTranslations("CulpritsModal");
  const { getAllQueryValues } = useFilterParams();
  const { showSuccess, showError } = useSnackbar();
  const {
    q,
    page,
    pageSize,
    organization,
    full_name,
    payroll_confirmed,
    recovered,
    start_date,
    end_date,
  } = getAllQueryValues();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  if (!currentUser || !canAccessSection(currentUser, "culprits")) {
    return <UnauthorizedPage />;
  }

  const canManage = hasPermission(currentUser, "manage_culprits");

  const [editing, setEditing] = useState<Culprit | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Culprit | null>(null);

  const updateMutation = useUpdateCulprit();
  const deleteMutation = useDeleteCulprit();

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const toBool = (v?: string) =>
    v === "true" ? true : v === "false" ? false : undefined;

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useCulprits({
    page: currentPage,
    page_size: itemsPerPage,
    search: q || undefined,
    organization: organization || undefined,
    full_name: full_name || undefined,
    payroll_confirmed: toBool(payroll_confirmed),
    recovered: toBool(recovered),
    from_date: start_date || undefined,
    end_date: end_date || undefined,
  });

  const data = apiResponse?.results ?? [];
  const totalItems = apiResponse?.count ?? 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;

  const error =
    apiError instanceof Error
      ? apiError
      : apiError
        ? new Error(t("messages.generic_error"))
        : null;

  const handleSave = useCallback(
    (payload: { full_name: string; amount: string }) => {
      if (!editing) return;
      updateMutation.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            showSuccess(tModal("messages.update_success"));
            setIsFormOpen(false);
            setEditing(null);
          },
          onError: (e: any) =>
            showError(
              tModal("messages.error_title"),
              e?.response?.data?.detail ||
                e?.message ||
                tModal("messages.error_message")
            ),
        }
      );
    },
    [editing, updateMutation, showSuccess, showError, tModal]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => {
        showSuccess(tModal("messages.delete_success"));
        setDeleting(null);
      },
      onError: (e: any) => {
        showError(
          tModal("messages.error_title"),
          e?.response?.data?.detail ||
            e?.message ||
            tModal("messages.error_message")
        );
        setDeleting(null);
      },
    });
  }, [deleting, deleteMutation, showSuccess, showError, tModal]);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      return `${String(d.getDate()).padStart(2, "0")}.${String(
        d.getMonth() + 1
      ).padStart(2, "0")}.${d.getFullYear()}`;
    } catch {
      return dateString;
    }
  }, []);

  const columns: TableColumn<Culprit>[] = [
    {
      key: "full_name",
      header: t("columns.full_name"),
      accessor: (row) => row.full_name || "-",
    },
    {
      key: "amount",
      header: t("columns.amount"),
      accessor: (row) => formatAmount(row.amount),
    },
    {
      key: "train_number",
      header: t("columns.train_number"),
      accessor: (row) => row.train_number || "-",
    },
    {
      key: "station",
      header: t("columns.station"),
      accessor: (row) => row.station || "-",
    },
    {
      key: "incident_date",
      header: t("columns.incident_date"),
      accessor: (row) => formatDate(row.incident_date),
    },
    {
      key: "responsible_org",
      header: t("columns.responsible_org"),
      accessor: (row) => row.responsible_org_name || "-",
    },
    {
      key: "payroll_confirmed",
      header: t("columns.payroll_confirmed"),
      accessor: (row) => (
        <Badge variant={row.payroll_confirmed ? "info" : "outline"}>
          {row.payroll_confirmed
            ? t("filters.yes")
            : t("filters.no")}
        </Badge>
      ),
    },
    {
      key: "recovered",
      header: t("columns.recovered"),
      accessor: (row) => (
        <Badge variant={row.recovered ? "success" : "outline"}>
          {row.recovered ? t("filters.yes") : t("filters.no")}
        </Badge>
      ),
    },
  ];

  const breadcrumbs = [
    { label: t("breadcrumbs.home"), href: "/" },
    { label: t("breadcrumbs.current"), current: true },
  ];

  const organizationOptions = useMemo(() => {
    const options = [{ value: "", label: t("filters.organization_placeholder") }];
    organizationsData?.forEach((org) =>
      options.push({ value: String(org.id), label: org.name })
    );
    return options;
  }, [organizationsData, t]);

  const yesNoOptions = useMemo(
    () => [
      { value: "", label: t("filters.all") },
      { value: "true", label: t("filters.yes") },
      { value: "false", label: t("filters.no") },
    ],
    [t]
  );

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-4">
        <PageFilters
          filters={[
            {
              name: "organization",
              label: t("filters.organization"),
              isSelect: true,
              options: organizationOptions,
              placeholder: t("filters.organization_placeholder"),
              loading: isLoadingOrganizations,
            },
            {
              name: "full_name",
              label: t("filters.full_name"),
              isSelect: false,
              placeholder: t("filters.full_name_placeholder"),
            },
            {
              name: "payroll_confirmed",
              label: t("filters.payroll_confirmed"),
              isSelect: true,
              options: yesNoOptions,
              searchable: false,
            },
            {
              name: "recovered",
              label: t("filters.recovered"),
              isSelect: true,
              options: yesNoOptions,
              searchable: false,
            },
          ]}
          hasSearch={false}
          hasDateRangePicker
          dateRangePickerLabel=""
          className="!mb-0"
        />
      </div>

      <div className="px-6 pb-6">
        <PaginatedTable
          columns={columns}
          data={data}
          getRowId={(row) => row.id}
          itemsPerPage={itemsPerPage}
          size="xs"
          isLoading={isLoading}
          error={error}
          totalPages={totalPages}
          totalItems={totalItems}
          updateQueryParams
          actionsDisplayMode="row"
          showActions={canManage}
          extraActions={
            canManage
              ? [
                  {
                    label: "",
                    icon: <Edit className="h-4 w-4" />,
                    onClick: (row: Culprit) => {
                      setEditing(row);
                      setIsFormOpen(true);
                    },
                    permission: "manage_culprits" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: Culprit) => !row.payroll_confirmed,
                  },
                  {
                    label: "",
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: (row: Culprit) => setDeleting(row),
                    permission: "manage_culprits" as Permission,
                    variant: "outline" as const,
                    shouldShow: (row: Culprit) => !row.payroll_confirmed,
                    className:
                      "border-red-600 text-red-600 hover:text-red-700 hover:border-red-600 hover:bg-red-600/10",
                  },
                ]
              : []
          }
          emptyTitle={t("empty.title")}
          emptyDescription={t("empty.description")}
        />
      </div>

      <CulpritFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        entry={editing}
        isPending={updateMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDeleteConfirm}
        title={tModal("delete.title")}
        message={tModal("delete.message")}
        confirmText={tModal("delete.confirm")}
        cancelText={tModal("delete.cancel")}
        isDoingActionText={tModal("delete.deleting")}
        isDoingAction={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
