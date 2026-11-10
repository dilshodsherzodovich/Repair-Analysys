"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { useInspections } from "@/api/hooks/use-report-inspections";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useTranslations } from "next-intl";
import { withRole } from "@/components/withRole";
import { useLocale } from "next-intl";
import CircularProgress from "@/components/circular-progress";
import { format } from "date-fns";
import { Button } from "@/ui/button";
import { LocomotiveHistoryForm } from "@/components/locomotive-history/LocomotiveHistoryForm";
import { LocomotiveInspectionsTimeline } from "@/components/locomotive-history/LocomotiveInspectionsTimeline";
import { Checkbox } from "@/ui/checkbox";
import { Label } from "@/ui/label";
import { generateLocomotiveInspectionsPdf } from "@/utils/locomotive-inspections-pdf-export";
import { generateLocomotiveInspectionsDocx } from "@/utils/locomotive-inspections-docx-export";
import { ExportActions } from "@/ui/export-actions";
import { PageHeader } from "@/ui/page-header";
import { Page } from "@/ui/page";

import { Field } from "@/ui/field";
function LocomotiveHistoryPage() {
  const t = useTranslations("LocomotiveHistory");
  const globalT = useTranslations("Inspects");
  const locale = useLocale();

  const [locomotiveId, setLocomotiveId] = useState<number | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [selectedInspectionTypes, setSelectedInspectionTypes] = useState<number[]>([]);

  const startDateStr = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
  const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

  const allFieldsComplete =
    shouldFetch &&
    locomotiveId !== undefined &&
    startDate !== undefined &&
    endDate !== undefined;

  const { data: inspectionsData, isLoading } = useInspections({
    enabled: allFieldsComplete,
    locomotive: allFieldsComplete ? locomotiveId : undefined,
    fromDate: allFieldsComplete ? startDateStr : undefined,
    toDate: allFieldsComplete ? endDateStr : undefined,
    orgNotRequired: true,
    no_page: true,
  });

  const { data: inspectionTypes } = useGetInspectionTypes();

  const handleFormSubmit = (locomotive: number, start: Date, end: Date) => {
    setLocomotiveId(locomotive);
    setStartDate(start);
    setEndDate(end);
    setShouldFetch(true);
  };

  const filteredInspections = useMemo(() => {
    if (!inspectionsData?.results) return [];
    if (selectedInspectionTypes.length === 0) return inspectionsData.results;
    return inspectionsData.results.filter((inspection) =>
      selectedInspectionTypes.includes(inspection.inspection_type.id)
    );
  }, [inspectionsData?.results, selectedInspectionTypes]);

  const countsByInspectionType = useMemo(() => {
    if (!inspectionsData?.results?.length || !inspectionTypes?.length) return [];
    const countByTypeId: Record<number, number> = {};
    inspectionTypes.forEach((type) => {
      countByTypeId[type.id] = inspectionsData.results.filter(
        (i) => i.inspection_type.id === type.id
      ).length;
    });
    return inspectionTypes
      .filter((type) => countByTypeId[type.id] > 0)
      .map((type) => ({ type, count: countByTypeId[type.id] }));
  }, [inspectionsData?.results, inspectionTypes]);

  const totalInspectionsCount = inspectionsData?.results?.length ?? 0;

  const handleInspectionTypeToggle = (typeId: number) => {
    setSelectedInspectionTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const handleSelectAll = () => {
    if (!inspectionTypes) return;
    if (selectedInspectionTypes.length === inspectionTypes.length) {
      setSelectedInspectionTypes([]);
    } else {
      setSelectedInspectionTypes(inspectionTypes.map((type) => type.id));
    }
  };

  const handleExportDocx = async () => {
    if (!inspectionsData || !filteredInspections.length || !startDate || !endDate) return;
    setIsExportingDocx(true);
    try {
      const locomotiveName =
        inspectionsData.results[0]?.locomotive?.name +
        " - " +
        inspectionsData.results[0]?.locomotive?.locomotive_model?.name;
      await generateLocomotiveInspectionsDocx({
        inspections: filteredInspections,
        locomotiveName,
        startDate,
        endDate,
        locale,
      });
    } catch (error) {
      console.error("Error generating DOCX:", error);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportPdf = async () => {
    if (!inspectionsData || !filteredInspections.length || !startDate || !endDate) return;
    setIsExporting(true);
    try {
      const locomotiveName =
        inspectionsData.results[0]?.locomotive?.name +
        " - " +
        inspectionsData.results[0]?.locomotive?.locomotive_model?.name;
      await generateLocomotiveInspectionsPdf({
        inspections: filteredInspections,
        locomotiveName,
        startDate,
        endDate,
        locale,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title={t("pageTitle")}
        actions={
          shouldFetch && inspectionsData && filteredInspections.length > 0 ? (
            <ExportActions
              onWord={handleExportDocx}
              onPdf={handleExportPdf}
              busy={isExportingDocx ? "word" : isExporting ? "pdf" : null}
            />
          ) : undefined
        }
        filters={
          <LocomotiveHistoryForm
            onSubmit={handleFormSubmit}
            onClear={() => setShouldFetch(false)}
          />
        }
      />

      {shouldFetch && locomotiveId && startDate && endDate && (
        <Card>
          <CardHeader>
            <CardTitle>{t("timelineTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && !inspectionsData ? (
              <div className="flex justify-center items-center h-64">
                <CircularProgress />
              </div>
            ) : inspectionsData && inspectionsData.results.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {t("countsForPeriod")}
                  </p>
                  <p className="text-base font-semibold mb-3">
                    {t("totalInspections")}: {totalInspectionsCount}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {countsByInspectionType.map(({ type, count }) => (
                      <span
                        key={type.id}
                        className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary"
                      >
                        {type.name}: {count}
                      </span>
                    ))}
                  </div>
                </div>

                {inspectionTypes && inspectionTypes.length > 0 && (
                  <div className="border rounded-lg p-4 bg-surface-muted">
                    <Field label={t("filterByInspectionType")} className="items-center justify-between mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-7 text-xs"
                      >
                        {selectedInspectionTypes.length === inspectionTypes.length
                          ? t("deselectAll")
                          : t("selectAll")}
                      </Button>
                    </Field>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {inspectionTypes.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type.id}`}
                            checked={selectedInspectionTypes.includes(type.id)}
                            onCheckedChange={() => handleInspectionTypeToggle(type.id)}
                          />
                          <Label
                            htmlFor={`type-${type.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {type.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredInspections.length > 0 ? (
                  <LocomotiveInspectionsTimeline
                    inspections={filteredInspections}
                    t={globalT}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("noFilteredData")}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Page>
  );
}

export default withRole(LocomotiveHistoryPage, [
  "admin",
  "dejurniy",
  "moderator",
  "tchzr",
]);
