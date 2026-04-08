"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, type TableColumn } from "@/ui/paginated-table";
import PageFilters from "@/ui/filters";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { getPageCount } from "@/lib/utils";
import {
  useManeuverJournals,
  useCreateManeuverJournal,
  useUpdateManeuverJournal,
} from "@/api/hooks/use-maneuver-journal";
import { ManeuverJournalEntry } from "@/api/types/maneuver-journal";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { Badge } from "@/ui/badge";
import { MoveRight } from "lucide-react";
import { ManeuverJournalModal } from "@/components/razvarot/maneuver-journal-modal";
import { useState } from "react";
import { authService } from "@/api/services/auth.service";

export default function RazvarotPage() {
  const t = useTranslations("ManeuverJournalPage");
  const { getAllQueryValues } = useFilterParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEntry, setSelectedEntry] =
    useState<ManeuverJournalEntry | null>(null);

  const createMutation = useCreateManeuverJournal();
  const updateMutation = useUpdateManeuverJournal();

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedEntry(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = (payload: any) => {
    if (modalMode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      });
    } else if (selectedEntry) {
      updateMutation.mutate(
        { id: selectedEntry.id, data: payload },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
        },
      );
    }
  };

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  if (!currentUser || !canAccessSection(currentUser, "razvarot")) {
    return <UnauthorizedPage />;
  }

  const user = authService.getUser();

  const { q, page, pageSize, locomotive, organization, start_date, end_date } =
    getAllQueryValues();

  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = pageSize ? parseInt(pageSize) : 10;

  const { data: locomotivesData, isLoading: isLoadingLocomotives } =
    useGetLocomotives();
  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const {
    data: apiResponse,
    isLoading,
    error: apiError,
  } = useManeuverJournals({
    page: currentPage,
    page_size: itemsPerPage,
    search: q || undefined,
    locomotive: locomotive || undefined,
    organization:
      user?.role === "admin"
        ? organization
        : user?.branch?.organization?.id || undefined,
    date_after: start_date || undefined,
    date_before: end_date || undefined,
  });

  const paginatedData = apiResponse?.results ?? [];
  const totalItems = apiResponse?.count ?? 0;
  const totalPages = getPageCount(totalItems, itemsPerPage) || 1;

  const error =
    apiError instanceof Error
      ? apiError
      : apiError
        ? new Error((apiError as any)?.message || t("errors.generic"))
        : null;

  const columns: TableColumn<ManeuverJournalEntry>[] = [
    {
      key: "locomotive",
      header: t("columns.locomotive"),
      accessor: (row) =>
        `${row.locomotive_info.name}-${row.locomotive_info.locomotive_model}`,
    },
    {
      key: "organization",
      header: t("columns.organization"),
      accessor: (row) => row.organization_info?.name,
    },
    {
      key: "station",
      header: t("columns.station"),
      accessor: (row) => row.station,
    },
    {
      key: "section",
      header: t("columns.section"),
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <Badge variant="info">{row.from_section}</Badge>{" "}
          <MoveRight width={16} height={16} />{" "}
          <Badge variant="success">{row.to_section}</Badge>
        </div>
      ),
    },
    {
      key: "date",
      header: t("columns.date"),
      accessor: (row) => row.date,
    },
  ];

  const locomotiveOptions = useMemo(() => {
    const options = [{ value: "", label: t("options.all_locomotives") }];
    if (locomotivesData && Array.isArray(locomotivesData?.results)) {
      locomotivesData.results.forEach((loc) =>
        options.push({
          value: loc.id.toString(),
          label: loc.name || loc.model_name || `Lokomotiv ${loc.id}`,
        }),
      );
    }
    return options;
  }, [locomotivesData, t]);

  const organizationOptions = useMemo(() => {
    const options = [{ value: "", label: t("options.all_organizations") }];
    if (organizationsData && Array.isArray(organizationsData)) {
      organizationsData.forEach((org) =>
        options.push({
          value: org.id.toString(),
          label: org.name || `Tashkilot ${org.id}`,
        }),
      );
    }
    return options;
  }, [organizationsData, t]);

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
          filters={[
            {
              name: "locomotive",
              label: t("filters.locomotive"),
              isSelect: true,
              options: locomotiveOptions,
              placeholder: t("filters.locomotive_placeholder"),
              searchable: true,
              loading: isLoadingLocomotives,
            },
            {
              name: "organization",
              label: t("filters.organization"),
              isSelect: true,
              options: organizationOptions,
              placeholder: t("filters.organization_placeholder"),
              searchable: true,
              loading: isLoadingOrganizations,
              permission: "choose_organization",
            },
          ]}
          hasSearch
          searchPlaceholder={t("search_placeholder")}
          hasDateRangePicker
          dateRangePickerLabel={t("filters.date_range")}
          className="!mb-0"
          onAdd={handleOpenCreateModal}
          addButtonPermittion="create_maneuver_journal"
        />
      </div>

      <div className="px-6 pb-6">
        <PaginatedTable
          columns={columns}
          data={paginatedData}
          getRowId={(row) => row.id}
          itemsPerPage={10}
          size="md"
          isLoading={isLoading}
          error={error}
          totalPages={totalPages}
          totalItems={totalItems}
          updateQueryParams
          emptyTitle={t("empty_title")}
          emptyDescription={t("empty_description")}
        />
      </div>

      <ManeuverJournalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        entry={selectedEntry}
        mode={modalMode}
        isPending={createMutation.isPending || updateMutation.isPending}
        currentUser={currentUser}
      />
    </div>
  );
}
