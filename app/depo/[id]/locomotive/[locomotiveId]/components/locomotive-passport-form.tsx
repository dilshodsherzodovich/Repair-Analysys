"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { useGetLocomotiveDetail } from "@/api/hooks/use-locomotives";
import { Loader2, Save, X, ArrowLeft, FileDown } from "lucide-react";
import { hasPermission } from "@/lib/permissions";
import { UserData } from "@/api/types/auth";
import { Card } from "@/ui/card";
import {
  useComponents,
  useBulkUpdateComponentValues,
} from "@/api/hooks/use-component";
import { toast } from "@/ui/use-toast";
import { ComponentValue } from "@/api/types/component";
import { exportLocomotivePassportPDF } from "@/lib/pdf-export";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";

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
  components: ComponentValue[] = []
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
  const isEditMode = searchParams.get("edit") === "true";

  const [componentFormValues, setComponentFormValues] =
    useState<ComponentValueFormState>({});
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [user, setUser] = useState<UserData | null>(null);
  const [hasInitializedComponents, setHasInitializedComponents] =
    useState(false);
  const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const numericLocomotiveId = Number(locomotiveId);
  const hasValidLocomotiveId = !Number.isNaN(numericLocomotiveId);

  const { data: locomotiveDetail } = useGetLocomotiveDetail(
    hasValidLocomotiveId ? numericLocomotiveId : undefined,
    hasValidLocomotiveId
  );

  const componentsQuery = useComponents(
    {
      no_page: true,
      locomotive: numericLocomotiveId,
      section: activeSectionId ?? undefined,
    },
    !!numericLocomotiveId && activeSectionId !== null
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
    []
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

  // Set active section when locomotive detail is loaded
  useEffect(() => {
    if (locomotiveDetail?.sections?.length && activeSectionId === null) {
      setActiveSectionId(locomotiveDetail.sections[0].id);
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

  useEffect(() => {
    setHasShownSuccessToast(false);
    setActiveSectionId(null);
  }, [numericLocomotiveId]);

  useEffect(() => {
    if (componentsQuery.isSuccess && !hasShownSuccessToast) {
      toast({
        title: "Komponentlar yuklandi",
        description: `${componentList.length} ta komponent topildi.`,
      });
      setHasShownSuccessToast(true);
    }
  }, [componentList.length, componentsQuery.isSuccess, hasShownSuccessToast]);

  useEffect(() => {
    if (componentsQuery.isError) {
      const errorMessage =
        (componentsQuery.error as { message?: string })?.message ||
        "Komponentlarni yuklashda xatolik yuz berdi.";
      toast({
        variant: "destructive",
        title: "Komponentlarni yuklashda xatolik",
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
        title: "PDF eksport qilish mumkin emas",
        description: "Ma'lumotlar to'liq yuklanmagan.",
      });
      return;
    }

    setIsExportingPDF(true);
    try {
      const activeSection = locomotiveDetail.sections?.find(
        (section) => section.id === activeSectionId
      );
      await exportLocomotivePassportPDF(
        locomotiveDetail,
        componentList,
        activeSection?.name
      );
      toast({
        title: "PDF muvaffaqiyatli eksport qilindi",
        description: "PDF fayl yuklab olindi.",
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast({
        variant: "destructive",
        title: "PDF eksport qilishda xatolik",
        description: "PDF faylni yaratishda muammo yuz berdi.",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const canEdit = hasPermission(user, "edit_locomotive_passport");

  const handleEdit = () => {
    setIsEditing(true);
    router.push(`?edit=true`, { scroll: false });
  };

  const handleCancel = () => {
    setIsEditing(false);
    router.push("?", { scroll: false });
    syncComponentFormValues(componentList);
  };

  const handleComponentFieldChange = (
    componentId: number,
    field: "factory_number" | "date_info",
    value: string
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
        title: "Komponentlar topilmadi",
        description: "Saqlashdan oldin komponentlar ro'yxatini yuklab oling.",
      });
      return;
    }

    const payload = buildComponentPayload();
    if (!payload.length) {
      toast({
        variant: "destructive",
        title: "Yaroqli ma'lumot topilmadi",
        description: "Iltimos, kamida bitta komponent qiymatini kiriting.",
      });
      return;
    }

    try {
      await bulkUpdateComponentValues(payload);
      // Refetch components to get updated data
      const refetchResult = await componentsQuery.refetch();
      // Sync form values with the refetched data
      if (
        refetchResult.data?.results &&
        Array.isArray(refetchResult.data.results)
      ) {
        syncComponentFormValues(refetchResult.data.results);
      }
      toast({
        title: "Ma'lumotlar saqlandi",
        description: "Komponent qiymatlari muvaffaqiyatli yangilandi.",
      });
      setIsEditing(false);
      router.push("?", { scroll: false });
    } catch (error) {
      console.error("Failed to save component values:", error);
      toast({
        variant: "destructive",
        title: "Saqlashda xatolik",
        description:
          "Server bilan aloqa muvaffaqiyatsiz bo'ldi. Qayta urinib ko'ring.",
      });
    }
  };

  return (
    <div className="space-y-6 pb-4 max-w-full overflow-x-hidden">
      <div className="flex justify-between gap-3 items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/depo/${depotId}`)}
            className="border-gray-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Orqaga
          </Button>
          <h1 className="text-2xl font-bold">
            {locomotiveDetail?.name} - {locomotiveDetail?.model_name}
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
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
                Eksport qilinmoqda...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                PDF eksport qilish
              </>
            )}
          </Button>
          {canEdit && (
            <>
              {!isEditing ? (
                <Button
                  onClick={handleEdit}
                  className="bg-[#2354BF] hover:bg-[#2354BF]/90 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Tahrirlash
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-gray-300"
                    disabled={isSavingComponents}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-[#2354BF] hover:bg-[#2354BF]/90 text-white"
                    disabled={isSavingComponents}
                  >
                    {isSavingComponents ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Saqlash
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <form className="space-y-6 pb-4 max-w-full overflow-x-hidden">
        <Card className="gap-4">
          <h1 className="text-lg font-semibold">Lokomotiv ma'lumotlari</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-[#0F172B]">
                Depo
              </label>
              <Input value={depotId} disabled />
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-[#0F172B]">
                Lokomotiv
              </label>
              <Input value={locomotiveDetail?.name ?? ""} disabled />
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-[#0F172B]">
                Model
              </label>
              <Input value={locomotiveDetail?.model_name ?? ""} disabled />
            </div>
          </div>
        </Card>

        {locomotiveDetail?.sections && locomotiveDetail.sections.length > 0 && (
          <Card className="gap-4">
            <div className="space-y-3">
              <h1 className="text-lg font-semibold">Aktiv seksiya:</h1>
              <Tabs
                value={activeSectionId?.toString() ?? ""}
                onValueChange={(value) => setActiveSectionId(Number(value))}
                className="w-full"
              >
                <TabsList className="bg-[#F1F5F9] p-2 gap-0 border-0 rounded-lg w-full flex">
                  {locomotiveDetail.sections.map((section) => (
                    <TabsTrigger
                      key={section.id}
                      value={section.id.toString()}
                      className="w-1/3"
                    >
                      {section.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </Card>
        )}

        <Card className="gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Komponentlar</h1>
            {isFetchingComponents && (
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Yuklanmoqda...
              </span>
            )}
          </div>

          {activeSectionId === null ? (
            <p className="text-sm text-muted-foreground">Bo'limni tanlang.</p>
          ) : !componentList.length && !isFetchingComponents ? (
            <p className="text-sm text-muted-foreground">
              Komponentlar topilmadi. Avval komponentlar ro'yxatini yarating.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {componentList.map((component) => {
                const currentValues = componentFormValues[component.id] || {
                  factory_number: "",
                  date_info: "",
                };

                return (
                  <div
                    key={component.id}
                    className="border border-border rounded-lg p-4 space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="min-w-0">
                        <label className="mb-2 block text-sm font-medium text-[#0F172B]">
                          {component.component}
                        </label>
                        <Input
                          value={currentValues.factory_number}
                          onChange={(event) =>
                            handleComponentFieldChange(
                              component.id,
                              "factory_number",
                              event.target.value
                            )
                          }
                          disabled={!isEditing}
                          placeholder="Zavod raqami"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="mb-2 block text-sm font-medium text-[#0F172B]">
                          {component.component} chiqarilgan yili
                        </label>
                        <Input
                          value={currentValues.date_info}
                          onChange={(event) =>
                            handleComponentFieldChange(
                              component.id,
                              "date_info",
                              event.target.value
                            )
                          }
                          disabled={!isEditing}
                          placeholder="Chiqarilgan yil"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
