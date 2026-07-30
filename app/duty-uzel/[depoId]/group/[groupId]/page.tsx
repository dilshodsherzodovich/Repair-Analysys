"use client";

import { useCallback, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PageFilters from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
import { Skeleton } from "@/ui/skeleton";
import { useComponentRegistryByGroup } from "@/api/hooks/use-component-registry";
import { useSnackbar } from "@/providers/snackbar-provider";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";
import { exportComponentGroupDetailsExcel } from "@/utils/duty-uzel-excel-export";
import { ComponentGroupComponents } from "../../components/component-group-components";

/** One component group on its own page — opened from the group view's list. */
export default function DutyUzelGroupPage() {
  const t = useTranslations("DutyUzelPage");
  const params = useParams();
  const searchParams = useSearchParams();
  const { showError } = useSnackbar();

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  if (!currentUser || !canAccessSection(currentUser, "duty_uzel")) {
    return <UnauthorizedPage />;
  }

  const depoId = params.depoId as string;
  const groupIdParam = params.groupId as string;
  const groupId = groupIdParam ? Number(groupIdParam) : undefined;

  const startDate = searchParams.get("defect_date_start") || undefined;
  const endDate = searchParams.get("defect_date_end") || undefined;

  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error } = useComponentRegistryByGroup({
    group_id: groupId,
    start_date: startDate,
    end_date: endDate,
  });

  const errorMessage = (() => {
    if (!error) return null;
    const payload = (error as any)?.response?.data;
    return Array.isArray(payload?.group_id)
      ? payload.group_id.join(" ")
      : payload?.detail || (error as Error)?.message || t("error_load");
  })();

  // Only this group's defect rows, banded per component
  const handleExport = useCallback(async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      await exportComponentGroupDetailsExcel(data, {
        t,
        startDate,
        endDate,
      });
    } catch (err) {
      showError(
        t("error_title"),
        err instanceof Error ? err.message : t("error_load")
      );
    } finally {
      setIsExporting(false);
    }
  }, [data, startDate, endDate, showError, t]);

  if (!groupId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("group_not_found")}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={data?.group?.name ?? t("groups_title")}
        description={t("title")}
        breadcrumbs={[
          { label: t("title"), href: `/duty-uzel/${depoId}?view=group` },
          { label: data?.group?.name ?? `#${groupId}`, current: true },
        ]}
      />

      <div className="mt-4">
        <PageFilters
          filters={[]}
          hasSearch={false}
          hasDateRangePicker={true}
          dateRangeStartKey="defect_date_start"
          dateRangeEndKey="defect_date_end"
          dateRangePickerLabel={t("columns.defect_date")}
          onExport={data ? handleExport : undefined}
          exportLoading={isExporting}
        />
      </div>

      {errorMessage && (
        <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#CAD5E2] bg-[#EFF6FF] px-4 py-2.5">
            <span className="text-sm font-semibold text-[#0F172B]">
              {data?.group?.name}
            </span>
            <span className="text-sm font-medium text-[#475569] whitespace-nowrap">
              {t("group_total", { count: data?.total_count ?? 0 })}
            </span>
          </div>

          <ComponentGroupComponents
            components={data?.components ?? []}
            defaultOpen
          />
        </div>
      )}
    </>
  );
}
