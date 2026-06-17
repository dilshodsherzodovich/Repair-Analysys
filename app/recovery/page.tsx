"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, type TableColumn } from "@/ui/paginated-table";
import PageFilters from "@/ui/filters";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { canAccessSection, hasPermission } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { useRecoveryDelays } from "@/api/hooks/use-recovery";
import type { RecoveryDelay } from "@/api/types/recovery";
import type { RecoveryStatus } from "@/api/types/culprits";
import { RECOVERY_STATUS_VALUES } from "@/api/types/culprits";
import { RecoveryCulpritsModal } from "@/components/recovery/recovery-culprits-modal";

function formatAmount(amount: string | number): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!value) return "0";
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function RecoveryPage() {
  const t = useTranslations("RecoveryPage");
  const { getAllQueryValues } = useFilterParams();
  const {
    q,
    page,
    pageSize,
    recovery_status,
    train_number,
    station,
    start_date,
    end_date,
  } = getAllQueryValues();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  if (!currentUser || !canAccessSection(currentUser, "recovery")) {
    return <UnauthorizedPage />;
  }

  // payroll roles confirm ОТЗ; accountant marks recovery
  const mode: "payroll" | "accountant" = hasPermission(
    currentUser,
    "confirm_recovery"
  )
    ? "accountant"
    : "payroll";

  const [selected, setSelected] = useState<RecoveryDelay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useRecoveryDelays({
    page: currentPage,
    page_size: itemsPerPage,
    search: q || undefined,
    recovery_status: (recovery_status as RecoveryStatus) || undefined,
    train_number: train_number || undefined,
    station: station || undefined,
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

  const recoveryStatusVariant = (status?: RecoveryStatus) => {
    switch (status) {
      case "accountant_confirmed":
        return "success" as const;
      case "payroll_confirmed":
        return "info" as const;
      default:
        return "outline" as const;
    }
  };

  const recoveryStatusLabel = useCallback(
    (status?: RecoveryStatus) =>
      status ? t(`recovery_status.${status}` as any) : "-",
    [t]
  );

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

  const handleOpen = useCallback((row: RecoveryDelay) => {
    setSelected(row);
    setIsModalOpen(true);
  }, []);

  const columns: TableColumn<RecoveryDelay>[] = [
    {
      key: "incident_date",
      header: t("columns.incident_date"),
      accessor: (row) => formatDate(row.incident_date),
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
      key: "responsible_org",
      header: t("columns.responsible_org"),
      accessor: (row) =>
        row.responsible_org_name || row.responsible_org_detail?.name || "-",
    },
    {
      key: "recovery_status",
      header: t("columns.recovery_status"),
      accessor: (row) => (
        <Badge variant={recoveryStatusVariant(row.recovery_status)}>
          {recoveryStatusLabel(row.recovery_status)}
        </Badge>
      ),
      width: "220px",
    },
    {
      key: "total_amount",
      header: t("columns.total_amount"),
      accessor: (row) => formatAmount(row.culprits_total_amount ?? 0),
    },
    {
      key: "recovered_amount",
      header: t("columns.recovered_amount"),
      accessor: (row) => formatAmount(row.culprits_recovered_amount ?? 0),
    },
    {
      key: "culprits",
      header: t("columns.culprits"),
      accessor: (row) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => handleOpen(row)}
        >
          <Users className="h-3.5 w-3.5 mr-1" />
          {t("open_button")} ({row.culprits?.length ?? 0})
        </Button>
      ),
    },
  ];

  const breadcrumbs = [
    { label: t("breadcrumbs.home"), href: "/" },
    { label: t("breadcrumbs.current"), current: true },
  ];

  const recoveryStatusOptions = useMemo(
    () => [
      { value: "", label: t("filters.recovery_status_all") },
      ...RECOVERY_STATUS_VALUES.map((s) => ({
        value: s,
        label: t(`recovery_status.${s}` as any),
      })),
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
              name: "recovery_status",
              label: t("filters.recovery_status"),
              isSelect: true,
              options: recoveryStatusOptions,
              placeholder: t("filters.recovery_status_placeholder"),
              searchable: false,
            },
            {
              name: "train_number",
              label: t("filters.train_number"),
              isSelect: false,
              placeholder: t("filters.train_number_placeholder"),
            },
            {
              name: "station",
              label: t("filters.station"),
              isSelect: false,
              placeholder: t("filters.station_placeholder"),
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
          showActions={false}
          emptyTitle={t("empty.title")}
          emptyDescription={t("empty.description")}
        />
      </div>

      <RecoveryCulpritsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelected(null);
        }}
        delay={selected}
        mode={mode}
      />
    </div>
  );
}
