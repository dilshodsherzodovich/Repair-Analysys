"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/ui/button";
import {
  useGetLocomotiveDetail,
  useGetLocomotiveModels,
  useLocomotiveFullDetail,
} from "@/api/hooks/use-locomotives";
import { Loader2, Save, X, ArrowLeft, FileDown } from "lucide-react";
import { hasPermission } from "@/lib/permissions";
import { UserData } from "@/api/types/auth";
import {
  useComponents,
  useBulkUpdateComponentValues,
} from "@/api/hooks/use-component";
import { toast } from "@/ui/use-toast";
import { ComponentValue } from "@/api/types/component";
import { exportLocomotivePassportPDF } from "@/lib/pdf-export";
import { LocomotiveModelData } from "@/api/types/locomotive";
import { useLocomotiveTxk13 } from "@/api/hooks/use-txk13-report";
import { useLocomotiveIntervalAnalyticsDetail } from "@/api/hooks/use-locomotive-interval-analytics";
import { PassportIdentity } from "./passport-identity";
import { PassportLocation } from "./passport-location";
import { PassportDrivers } from "./passport-drivers";
import { PassportInspections } from "./passport-inspections";
import { PassportInspectionHistory } from "./passport-inspection-history";
import { PassportComponents } from "./passport-components";
import { PassportJournals } from "./passport-journals";
import { PassportRegistry } from "./passport-registry";
import { PassportOilStatus } from "./passport-oil-status";
import { PassportDashboard, type PassportView } from "./passport-dashboard";

interface LocomotivePassportFormProps {
  depotId: string;
  locomotiveId: string;
}

type ComponentValueFormState = Record<
  number,
  {
    factory_number: string;
    date_info: string;
  }
>;

const buildFormStateFromComponents = (
  components: ComponentValue[] = [],
): ComponentValueFormState => {
  if (!Array.isArray(components)) {
    return {};
  }
  return components.reduce<ComponentValueFormState>((acc, component) => {
    acc[component.id] = {
      factory_number: component.factory_number ?? "",
      date_info: component.date_info ?? "",
    };
    return acc;
  }, {});
};

const sanitizeValue = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export default function LocomotivePassportForm({
  depotId,
  locomotiveId,
}: LocomotivePassportFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("locomotivePassport");
  const isEditMode = searchParams.get("edit") === "true";

  // Which area is drilled into ("see details"); null = the dashboard landing.
  const viewParam = searchParams.get("view");
  const view: PassportView | null =
    viewParam === "inspections" ||
    viewParam === "oil" ||
    viewParam === "location" ||
    viewParam === "crew" ||
    viewParam === "components" ||
    viewParam === "journals"
      ? viewParam
      : null;

  const [componentFormValues, setComponentFormValues] =
    useState<ComponentValueFormState>({});
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [user, setUser] = useState<UserData | null>(null);
  const [hasInitializedComponents, setHasInitializedComponents] =
    useState(false);
  const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  // Only reset section when locomotive ID actually changes (not on revisit).
  const prevLocomotiveIdRef = useRef<number | null>(null);

  const numericLocomotiveId = Number(locomotiveId);
  const hasValidLocomotiveId = !Number.isNaN(numericLocomotiveId);

  const { data: locomotiveDetail } = useGetLocomotiveDetail(
    hasValidLocomotiveId ? numericLocomotiveId : undefined,
    hasValidLocomotiveId,
  );

  const numericDepotId = Number(depotId);
  const hasValidDepotId = !Number.isNaN(numericDepotId);

  // Enrichment data sources (shared backend + external EMM/GPS service).
  const { locomotive: txk13Data, isLoading: isTxk13Loading } =
    useLocomotiveTxk13(
      hasValidDepotId ? numericDepotId : undefined,
      hasValidLocomotiveId ? numericLocomotiveId : undefined,
      hasValidLocomotiveId,
    );

  // Canonical locomotive metadata (state, service/locomotive type, GPS IMEI,
  // on-assignment flag) — sourced from `/locomotives/{id}/`.
  const { data: locomotiveFullDetail } = useLocomotiveFullDetail(
    hasValidLocomotiveId ? numericLocomotiveId : undefined,
    hasValidLocomotiveId,
  );

  const { analytics: intervalAnalytics, isLoading: isAnalyticsLoading } =
    useLocomotiveIntervalAnalyticsDetail(
      hasValidDepotId ? numericDepotId : undefined,
      hasValidLocomotiveId ? numericLocomotiveId : undefined,
      hasValidLocomotiveId,
    );

  const modelIdNum = locomotiveDetail?.model_id
    ? Number(locomotiveDetail.model_id)
    : undefined;

  // Resolve the model image the same way the locomotives table does.
  const { data: locomotiveModelsData } = useGetLocomotiveModels({
    no_page: true,
  });
  const modelImage = locomotiveModelsData?.results?.find(
    (model: LocomotiveModelData) => model.id === modelIdNum,
  )?.image;

  const componentsQuery = useComponents(
    {
      no_page: true,
      locomotive: numericLocomotiveId,
      section: activeSectionId ?? undefined,
    },
    !!numericLocomotiveId && activeSectionId !== null,
  );
  const componentsData = componentsQuery.data;
  const isFetchingComponents = componentsQuery.isFetching;
  const componentList = componentsData?.results ?? [];

  const {
    mutateAsync: bulkUpdateComponentValues,
    isPending: isSavingComponents,
  } = useBulkUpdateComponentValues();

  const syncComponentFormValues = useCallback(
    (components?: ComponentValue[]) => {
      setComponentFormValues(buildFormStateFromComponents(components));
    },
    [],
  );

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  // Set active section when locomotive detail is loaded (including from cache).
  useEffect(() => {
    if (!locomotiveDetail?.sections?.length) return;
    const firstSectionId = locomotiveDetail.sections[0].id;
    if (activeSectionId === null) {
      setActiveSectionId(firstSectionId);
      return;
    }
    const sectionExists = locomotiveDetail.sections.some(
      (s) => s.id === activeSectionId,
    );
    if (!sectionExists) {
      setActiveSectionId(firstSectionId);
    }
  }, [locomotiveDetail, activeSectionId]);

  useEffect(() => {
    if (hasInitializedComponents || !componentsData?.results?.length) return;
    syncComponentFormValues(componentsData.results);
    setHasInitializedComponents(true);
  }, [componentsData, hasInitializedComponents, syncComponentFormValues]);

  // Reset initialization when section changes
  useEffect(() => {
    setHasInitializedComponents(false);
    setComponentFormValues({});
  }, [activeSectionId]);

  // Only reset section when navigating to a different locomotive.
  useEffect(() => {
    const prevId = prevLocomotiveIdRef.current;
    prevLocomotiveIdRef.current = numericLocomotiveId;
    if (prevId !== null && prevId !== numericLocomotiveId) {
      setHasShownSuccessToast(false);
      setActiveSectionId(null);
    }
  }, [numericLocomotiveId]);

  useEffect(() => {
    if (componentsQuery.isSuccess && !hasShownSuccessToast) {
      toast({
        title: t("toasts.componentsLoadedTitle"),
        description: t("toasts.componentsLoadedDesc", {
          count: componentList.length,
        }),
      });
      setHasShownSuccessToast(true);
    }
  }, [componentList.length, componentsQuery.isSuccess, hasShownSuccessToast]);

  useEffect(() => {
    if (componentsQuery.isError) {
      const errorMessage =
        (componentsQuery.error as { message?: string })?.message ||
        t("toasts.componentsErrorDesc");
      toast({
        variant: "destructive",
        title: t("toasts.componentsErrorTitle"),
        description: errorMessage,
      });
    }
  }, [componentsQuery.error, componentsQuery.isError]);

  const handleExportPDF = async () => {
    if (
      !locomotiveDetail ||
      activeSectionId === null ||
      componentList.length === 0
    ) {
      toast({
        variant: "destructive",
        title: t("toasts.pdfCannotTitle"),
        description: t("toasts.pdfCannotDesc"),
      });
      return;
    }

    setIsExportingPDF(true);
    try {
      const activeSection = locomotiveDetail.sections?.find(
        (section) => section.id === activeSectionId,
      );
      await exportLocomotivePassportPDF(
        locomotiveDetail,
        componentList,
        activeSection?.name,
      );
      toast({
        title: t("toasts.pdfSuccessTitle"),
        description: t("toasts.pdfSuccessDesc"),
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast({
        variant: "destructive",
        title: t("toasts.pdfErrorTitle"),
        description: t("toasts.pdfErrorDesc"),
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const canEdit = hasPermission(user, "edit_locomotive_passport");

  const openView = (next: PassportView) =>
    router.push(`?view=${next}`, { scroll: false });
  const backToDashboard = () => {
    setIsEditing(false);
    router.push("?", { scroll: false });
  };

  const handleEdit = () => {
    setIsEditing(true);
    router.push(`?view=components&edit=true`, { scroll: false });
  };

  const handleCancel = () => {
    setIsEditing(false);
    router.push("?view=components", { scroll: false });
    syncComponentFormValues(componentList);
  };

  const handleComponentFieldChange = (
    componentId: number,
    field: "factory_number" | "date_info",
    value: string,
  ) => {
    setComponentFormValues((prev) => {
      const existing = prev[componentId] || {
        factory_number: "",
        date_info: "",
      };
      return {
        ...prev,
        [componentId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const buildComponentPayload = useCallback((): ComponentValue[] => {
    if (!componentList.length) {
      return [];
    }

    return componentList.map((componentValue) => {
      const currentValues = componentFormValues[componentValue.id] || {
        factory_number: "",
        date_info: "",
      };

      return {
        ...componentValue,
        factory_number: sanitizeValue(currentValues.factory_number),
        date_info: sanitizeValue(currentValues.date_info),
      };
    });
  }, [componentFormValues, componentList]);

  const handleSave = async () => {
    if (!componentList.length) {
      toast({
        variant: "destructive",
        title: t("toasts.noComponentsTitle"),
        description: t("toasts.noComponentsDesc"),
      });
      return;
    }

    const payload = buildComponentPayload();
    if (!payload.length) {
      toast({
        variant: "destructive",
        title: t("toasts.noValidDataTitle"),
        description: t("toasts.noValidDataDesc"),
      });
      return;
    }

    try {
      await bulkUpdateComponentValues(payload);
      const refetchResult = await componentsQuery.refetch();
      if (
        refetchResult.data?.results &&
        Array.isArray(refetchResult.data.results)
      ) {
        syncComponentFormValues(refetchResult.data.results);
      }
      toast({
        title: t("toasts.savedTitle"),
        description: t("toasts.savedDesc"),
      });
      setIsEditing(false);
      router.push("?view=components", { scroll: false });
    } catch (error) {
      console.error("Failed to save component values:", error);
      toast({
        variant: "destructive",
        title: t("toasts.saveErrorTitle"),
        description: t("toasts.saveErrorDesc"),
      });
    }
  };

  return (
    <div className="space-y-6 pb-4 max-w-full overflow-x-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button
          variant="outline"
          onClick={() => router.push(`/depo/${depotId}`)}
          className="border-gray-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
      </div>

      {/* Identity data page — the laminated passport band */}
      <PassportIdentity
        name={locomotiveDetail?.name}
        modelName={locomotiveDetail?.model_name}
        sectionsCount={locomotiveDetail?.sections?.length}
        imageUrl={modelImage}
        txk13={txk13Data}
        detail={locomotiveFullDetail}
        modelId={modelIdNum}
      />

      {/* Dashboard landing — compact previews that drill into full areas */}
      {view === null ? (
        <PassportDashboard
          onOpen={openView}
          imei={locomotiveFullDetail?.gps_imei_code}
          locomotiveNumber={locomotiveDetail?.name}
          modelId={modelIdNum}
          locomotiveId={numericLocomotiveId}
          txk13={txk13Data}
          isTxk13Loading={isTxk13Loading}
          sections={locomotiveDetail?.sections ?? []}
        />
      ) : (
        <div className="space-y-6">
          {/* Back to the dashboard landing */}
          <Button
            variant="ghost"
            onClick={backToDashboard}
            className="h-8 px-2 text-muted-foreground hover:text-[#0F172B]"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t("dashboard.backToOverview")}
          </Button>

          {/* Location: live GPS + history */}
          {view === "location" && (
            <div className="max-w-3xl">
              <PassportLocation imei={locomotiveFullDetail?.gps_imei_code} />
            </div>
          )}

          {/* Crew: assigned drivers */}
          {view === "crew" && (
            <div className="max-w-3xl">
              <PassportDrivers
                locomotiveNumber={locomotiveDetail?.name}
                modelId={modelIdNum}
              />
            </div>
          )}

          {/* Oil: laboratory analyses */}
          {view === "oil" && (
            <PassportOilStatus
              locomotiveId={numericLocomotiveId}
              locomotiveModelId={modelIdNum}
            />
          )}

          {/* Inspections: interval analytics + txk13 + history */}
          {view === "inspections" && (
            <div className="space-y-6">
              <PassportInspections
                txk13={txk13Data}
                isLoading={isTxk13Loading}
                analytics={intervalAnalytics}
                isAnalyticsLoading={isAnalyticsLoading}
              />
              <PassportInspectionHistory locomotiveId={numericLocomotiveId} />
            </div>
          )}

          {/* Components: uzellar editor (per section) + registry */}
          {view === "components" && (
            <div className="space-y-6">
              <PassportComponents
                sections={locomotiveDetail?.sections ?? []}
                activeSectionId={activeSectionId}
                onSectionChange={setActiveSectionId}
                components={componentList}
                formValues={componentFormValues}
                onFieldChange={handleComponentFieldChange}
                isEditing={isEditing}
                canEdit={canEdit}
                isFetching={isFetchingComponents}
                actions={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={handleExportPDF}
                      variant="outline"
                      className="border-gray-300"
                      disabled={
                        isExportingPDF ||
                        !locomotiveDetail ||
                        activeSectionId === null ||
                        componentList.length === 0
                      }
                    >
                      {isExportingPDF ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("actions.exporting")}
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          {t("actions.pdfExport")}
                        </>
                      )}
                    </Button>
                    {canEdit &&
                      (!isEditing ? (
                        <Button
                          size="sm"
                          onClick={handleEdit}
                          className="bg-[#2354BF] hover:bg-[#2354BF]/90 text-white"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {t("actions.edit")}
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={handleCancel}
                            variant="outline"
                            className="border-gray-300"
                            disabled={isSavingComponents}
                          >
                            <X className="mr-2 h-4 w-4" />
                            {t("actions.cancel")}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-[#2354BF] hover:bg-[#2354BF]/90 text-white"
                            disabled={isSavingComponents}
                          >
                            {isSavingComponents ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("actions.saving")}
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                {t("actions.save")}
                              </>
                            )}
                          </Button>
                        </>
                      ))}
                  </div>
                }
              />

              <PassportRegistry locomotiveId={numericLocomotiveId} />
            </div>
          )}

          {/* Journals: mpr + pantograph + revision */}
          {view === "journals" && (
            <PassportJournals locomotiveId={numericLocomotiveId} />
          )}
        </div>
      )}
    </div>
  );
}
