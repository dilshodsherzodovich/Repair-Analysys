"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PageFilters, { FiltersQuery } from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
import {
  useGetLocomotiveModels,
  useGetLocomotives,
} from "@/api/hooks/use-locomotives";
import { useBandages } from "@/api/hooks/use-bandages";
import { Bandage } from "@/api/types/bandage";
import { UserData } from "@/api/types/auth";
import {
  canAccessSection,
  canEditOrganization,
  hasPermission,
} from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";
import { authService } from "@/api/services/auth.service";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import {
  BandagesTable,
  LocomotiveGroup,
  SectionRow,
  naturalCompare,
} from "./components/bandages-table";
import { BandageGroupCards } from "./components/bandage-group-cards";
import { bandageGroupKey } from "./bandage-groups";
import { exportBandagesExcel } from "@/utils/bandages-excel-export";
import { useSnackbar } from "@/providers/snackbar-provider";
import { Alert, AlertDescription } from "@/ui/alert";
import { ExportActions } from "@/ui/export-actions";

function BandagesPageContent({
  user,
  organizationId,
}: {
  user: UserData;
  organizationId: number;
}) {
  const t = useTranslations("BandagesPage");
  const tModal = useTranslations("BandagesModal");
  const { showError } = useSnackbar();
  const searchParams = useSearchParams();
  const { q, locModel } = Object.fromEntries(searchParams.entries());
  const activeGroup = searchParams.get("group") || null;
  const { updateQuery } = useFilterParams();

  // Editing is limited to the user's own organization
  const canEdit =
    hasPermission(user, "edit_bandage") &&
    canEditOrganization(user, organizationId);

  const { data: locomotiveModelsData, isPending: loadingModels } =
    useGetLocomotiveModels({ no_page: true });

  const {
    data: locomotivesData,
    isPending: loadingLocomotives,
    isError: locomotivesError,
  } = useGetLocomotives(true, undefined, {
    no_page: true,
    locomotive_model: +locModel || undefined,
    search: q || undefined,
    registered_organization: organizationId,
  });
  const {
    data: bandagesData,
    isPending: loadingBandages,
    isError: bandagesError,
  } = useBandages({});

  const isLoading = loadingLocomotives || loadingBandages;
  const isError = locomotivesError || bandagesError;

  const [editingId, setEditingId] = useState<number | null>(null);
  // Stable so memoized rows don't re-render when the page does
  const handleEdit = useCallback((id: number) => setEditingId(id), []);
  const handleDone = useCallback(() => setEditingId(null), []);

  // Picking a group card drops any edit in progress
  const handleGroupSelect = useCallback(
    (key: string | null) => {
      setEditingId(null);
      updateQuery({ group: key });
    },
    [updateQuery],
  );

  // Locomotives drive the list (filters apply to them); bandages fill the cells.
  // One table row per locomotive section.
  const { groups, componentNames } = useMemo(() => {
    const locomotives = locomotivesData?.results ?? [];
    const byLocomotive = new Map<number, Bandage[]>();
    (bandagesData ?? []).forEach((bandage) => {
      if (!byLocomotive.has(bandage.locomotive)) {
        byLocomotive.set(bandage.locomotive, []);
      }
      byLocomotive.get(bandage.locomotive)!.push(bandage);
    });

    const names = new Set<string>();
    const result: LocomotiveGroup[] = locomotives.map((locomotive, i) => {
      const bandages = byLocomotive.get(locomotive.id) ?? [];
      const sections = new Map<string, SectionRow>();

      bandages.forEach((bandage) => {
        names.add(bandage.component_name);
        const sectionKey = String(bandage.section ?? "none");
        if (!sections.has(sectionKey)) {
          sections.set(sectionKey, {
            key: `${locomotive.id}-${sectionKey}`,
            sectionName: bandage.section_name ?? tModal("no_section"),
            byComponent: {},
          });
        }
        sections.get(sectionKey)!.byComponent[bandage.component_name] =
          bandage;
      });

      return {
        locomotiveId: locomotive.id,
        index: i + 1,
        name: locomotive.name,
        modelName: locomotive.model_name,
        bandages,
        sections: sections.size
          ? Array.from(sections.values()).sort((a, b) =>
              naturalCompare(a.sectionName, b.sectionName),
            )
          : [{ key: `${locomotive.id}-empty`, sectionName: "—", byComponent: {} }],
      };
    });

    return {
      groups: result,
      componentNames: Array.from(names).sort(naturalCompare),
    };
  }, [locomotivesData, bandagesData, tModal]);

  // Cards count what the filters left; the table also narrows to the picked group
  const listedBandages = useMemo(
    () => groups.flatMap((group) => group.bandages),
    [groups],
  );
  const visibleGroups = useMemo(
    () =>
      activeGroup
        ? groups
            .filter((group) =>
              group.bandages.some(
                (bandage) => bandageGroupKey(bandage) === activeGroup,
              ),
            )
            .map((group, i) => ({ ...group, index: i + 1 }))
        : groups,
    [groups, activeGroup],
  );

  const [isExporting, setIsExporting] = useState(false);

  // Exports the table as shown: current filters and the picked group
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportBandagesExcel(
        { visibleGroups, allGroups: groups, componentNames },
        { t, tModal, activeGroup },
      );
    } catch (error) {
      console.error("Error exporting bandages:", error);
      showError(t("excel.error"));
    } finally {
      setIsExporting(false);
    }
  }, [visibleGroups, groups, componentNames, t, tModal, activeGroup, showError]);

  const pageFilters: FiltersQuery[] = useMemo(
    () => [
      {
        name: "locModel",
        label: t("locModel_label"),
        isSelect: true,
        options: [
          { label: t("all"), value: "" },
          ...(locomotiveModelsData?.results?.map((model) => ({
            label: model?.name,
            value: String(model.id),
          })) || []),
        ],
        placeholder: t("locModel_placeholder"),
        searchable: true,
        clearable: true,
        loading: loadingModels,
      },
    ],
    [t, locomotiveModelsData, loadingModels],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        filters={
          <PageFilters
            filters={pageFilters}
            hasSearch={true}
            searchPlaceholder={t("search_placeholder")}
          />
        }
        actions={<ExportActions onExcel={isLoading ? undefined : handleExport} busy={isExporting ? "excel" : null} />}
      />

      {isError && (
        <Alert variant="destructive"><AlertDescription>
          {t("error_load")}
        </AlertDescription></Alert>
      )}

      <BandageGroupCards
        bandages={listedBandages}
        activeGroup={activeGroup}
        onSelect={handleGroupSelect}
        isLoading={isLoading}
      />

      <BandagesTable
        groups={visibleGroups}
        componentNames={componentNames}
        canEdit={canEdit}
        isLoading={isLoading}
        editingId={editingId}
        onEdit={handleEdit}
        onDone={handleDone}
        activeGroup={activeGroup}
      />
    </div>
  );
}

export default function BandagesPage() {
  const params = useParams();
  const organizationId = Number(params.orgId) || undefined;
  const [user, setUser] = useState<UserData | null | undefined>(undefined);

  useEffect(() => {
    try {
      setUser(authService.getUser());
    } catch {
      setUser(null);
    }
  }, []);

  if (user === undefined) return null;
  if (!user || !canAccessSection(user, "depo")) {
    return <UnauthorizedPage />;
  }

  if (!organizationId) return <UnauthorizedPage />;

  // Keyed so switching organizations drops any edit in progress
  return (
    <BandagesPageContent
      key={organizationId}
      user={user}
      organizationId={organizationId}
    />
  );
}
