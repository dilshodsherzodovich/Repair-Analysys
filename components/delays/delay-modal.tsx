"use client";

import { useEffect, useMemo, useState, type FormEvent, useRef } from "react";
import { Card } from "@/ui/card";
import { Modal } from "@/ui/modal";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SearchableSelect,
} from "@/ui/select";
import { Button } from "@/ui/button";
import { FormField } from "@/ui/form-field";
import { DatePicker } from "@/ui/date-picker";
import { FileUpload } from "@/ui/file-upload";
import { FileText } from "lucide-react";
import {
  DelayEntry,
  DelayCreatePayload,
  DelayUpdatePayload,
  DELAY_TYPE_OPTIONS,
  STATION_OPTIONS,
  TRAIN_TYPE_OPTIONS,
  GROUP_REASON_OPTIONS,
  TrainType,
  GroupReason,
} from "@/api/types/delays";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useSnackbar } from "@/providers/snackbar-provider";
import { hasPermission } from "@/lib/permissions";
import type { UserData } from "@/api/types/auth";
import type { Organization } from "@/api/types/organizations";
import { useTranslations } from "next-intl";

interface DelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: DelayCreatePayload | DelayUpdatePayload) => void;
  entry?: DelayEntry | null;
  mode: "create" | "edit" | "moderate";
  isPending: boolean;
  user?: UserData | null;
}

type FormData = {
  delay_type: string;
  train_number: string;
  station: string;
  delay_time: string; // Minutes as string
  reason: string;
  damage_amount: string;
  responsible_org: string;
  status: string;
  archive: string;
  group_reason: string;
  train_type: string;
};

const INITIAL_FORM_DATA: FormData = {
  delay_type: "",
  train_number: "",
  station: "",
  delay_time: "", // Minutes
  reason: "",
  damage_amount: "0",
  responsible_org: "",
  status: "true", // Defaults to true when creating
  archive: "false", // Defaults to false (not archived)
  group_reason: "",
  train_type: "",
};

// Convert minutes to HH:MM:SS format
function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const secs = 0; // Always 0 for seconds
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Convert HH:MM:SS or HH:MM to minutes
function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  // Handle formats: "HH:MM:SS", "HH:MM", "H:M"
  const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const hours = parseInt(match[1], 10) || 0;
    const minutes = parseInt(match[2], 10) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

function OrganizationSelectField({
  name,
  defaultValue,
  organizations,
  isLoading,
  disabled,
}: {
  name: string;
  defaultValue?: string;
  organizations: Organization[];
  isLoading: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("DelayModal");

  return (
    <div>
      <Label htmlFor="responsible_org">{t("fields.responsible_org")}</Label>
      <Select
        name={name}
        defaultValue={defaultValue}
        disabled={isLoading || disabled}
      >
        <SelectTrigger id="responsible_org">
          <SelectValue placeholder={t("fields.responsible_org_placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              {t("fields.responsible_org_loading")}
            </SelectItem>
          ) : organizations.length ? (
            organizations.map((org) => (
              <SelectItem key={org.id} value={String(org.id)}>
                {org.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="empty" disabled>
              {t("fields.responsible_org_empty")}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DelayModal({
  isOpen,
  onClose,
  onSave,
  entry,
  mode,
  isPending,
  user,
}: DelayModalProps) {
  const t = useTranslations("DelayModal");
  const isModerateMode = mode === "moderate";
  const canUploadReport = hasPermission(user ?? null, "upload_delay_report");
  // sriv_moderator can change status and upload report
  const canChangeStatus = hasPermission(user ?? null, "upload_delay_report"); // sriv_moderator can change status
  // sriv_admin can change status when editing (but not in moderate mode)
  const canChangeStatusAdmin =
    hasPermission(user ?? null, "edit_delay") &&
    !hasPermission(user ?? null, "upload_delay_report") &&
    !isModerateMode;
  const canEditFields =
    hasPermission(user ?? null, "edit_delay") &&
    !hasPermission(user ?? null, "upload_delay_report");
  const [formDefaults, setFormDefaults] = useState<FormData>(INITIAL_FORM_DATA);
  const [stationValue, setStationValue] = useState<string>("");
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [reportFile, setReportFile] = useState<File | null>(null);
  const { showError } = useSnackbar();

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  useEffect(() => {
    if (!isOpen) return;

    if (entry && (mode === "edit" || mode === "moderate")) {
      // Convert delay_time from HH:MM:SS to minutes
      const minutes = timeStringToMinutes(entry.delay_time || "");

      const defaults = {
        delay_type: entry.delay_type || "",
        train_number: entry.train_number || "",
        station: entry.station || "",
        delay_time: minutes > 0 ? String(minutes) : "",
        reason: entry.reason || "",
        damage_amount: String(entry.damage_amount || 0),
        responsible_org: entry.responsible_org
          ? String(entry.responsible_org)
          : "",
        status: entry.status ? "true" : "false", // Use actual entry status
        archive: entry.archive ? "true" : "false",
        group_reason: entry.group_reason || "",
        train_type: entry.train_type || "",
      };
      setFormDefaults(defaults);
      setSelectedDate(
        entry.incident_date ? new Date(entry.incident_date) : undefined,
      );
      setStationValue(entry.station || "");
      setReportFile(null); // Don't pre-fill file on edit
    } else {
      setFormDefaults(INITIAL_FORM_DATA);
      setSelectedDate(undefined);
      setStationValue("");
      setReportFile(null);
    }
    // Reset archive to false when opening modal
    if (mode === "create") {
      setFormDefaults((prev) => ({ ...prev, archive: "false" }));
    }
    setFormKey((prev) => prev + 1);
  }, [entry, mode, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const formElement = event.currentTarget as HTMLFormElement;
    const data = new FormData(formElement);

    if (isModerateMode) {
      // In moderate mode, sriv_moderator can change status and upload report
      const statusValue = (data.get("status") as string) === "true";
      const payload: DelayUpdatePayload = {
        status: statusValue, // sriv_moderator can change status
        ...(canUploadReport && reportFile && { report: reportFile }),
      };
      onSave(payload);
      return;
    }

    const delayType = (data.get("delay_type") as string) || "";
    const trainNumber = (data.get("train_number") as string) || "";
    const station = (data.get("station") as string) || "";
    const delayTimeMinutes = (data.get("delay_time") as string) || "";
    const reason = (data.get("reason") as string) || "";
    const damageAmount = (data.get("damage_amount") as string) || "0";
    const responsibleOrg = (data.get("responsible_org") as string) || "";
    const status = (data.get("status") as string) === "true";
    const groupReason = (data.get("group_reason") as string) || "";
    const trainType = (data.get("train_type") as string) || "";

    if (!delayType || !trainNumber || !station || !responsibleOrg) {
      showError(t("errors.required_fields"));
      return;
    }

    if (mode === "create" && (!groupReason || !trainType)) {
      showError(t("errors.group_reason_and_train_type"));
      return;
    }

    if (
      !delayTimeMinutes ||
      isNaN(Number(delayTimeMinutes)) ||
      Number(delayTimeMinutes) < 0
    ) {
      showError(t("errors.delay_time"));
      return;
    }

    if (!selectedDate) {
      showError(t("errors.incident_date"));
      return;
    }

    // Format date as YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split("T")[0];

    // Convert minutes to HH:MM:SS format
    const minutes = parseInt(delayTimeMinutes, 10);
    const formattedTime = minutesToTimeString(minutes);

    const payload: DelayCreatePayload | DelayUpdatePayload = {
      delay_type: delayType as "Po prosledovaniyu" | "Po otpravleniyu",
      train_number: trainNumber.trim(),
      station: station.trim(),
      delay_time: formattedTime,
      reason: reason.trim(),
      damage_amount: Number.parseFloat(damageAmount) || 0,
      responsible_org: Number(responsibleOrg),
      incident_date: formattedDate,
      // Status defaults to true when creating, can be changed by sriv_moderator or sriv_admin when editing
      ...(mode === "create"
        ? { status: true }
        : (canChangeStatus || canChangeStatusAdmin) && { status }),
      // Archive defaults to false, only changed by sriv_admin via "Tasdiqlash" action
      ...(mode === "create" ? { archive: false } : {}),
      ...(canUploadReport && reportFile && { report: reportFile }),
      // Add new fields
      ...(mode === "create"
        ? {
            group_reason: groupReason as GroupReason,
            train_type: trainType as TrainType,
          }
        : {
            ...(groupReason && { group_reason: groupReason as GroupReason }),
            ...(trainType && { train_type: trainType as TrainType }),
          }),
    };

    onSave(payload);
  };

  const handleClose = () => {
    setFormDefaults(INITIAL_FORM_DATA);
    setSelectedDate(undefined);
    setStationValue("");
    setReportFile(null);
    setFormKey((prev) => prev + 1);
    formRef.current?.reset();
    onClose();
  };

  const modalTexts = useMemo(
    () => ({
      title:
        mode === "create"
          ? t("title_create")
          : mode === "moderate"
            ? t("title_moderate")
            : t("title_edit"),
      submit: mode === "create" ? t("submit_create") : t("submit_edit"),
      pending: mode === "create" ? t("pending_create") : t("pending_edit"),
    }),
    [mode, t],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTexts.title}
      size="lg"
      ariaDescribedBy="delay-modal"
    >
      <Card className="border-none p-0 mt-4">
        <form
          key={formKey}
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isModerateMode && (
              <>
                <FormField
                  id="train_number"
                  name="train_number"
                  label={t("fields.train_number")}
                  defaultValue={formDefaults.train_number}
                  placeholder={t("fields.train_number_placeholder")}
                  required
                />

                <div>
                  <Label htmlFor="train_type">{t("fields.train_type")}</Label>
                  <Select
                    name="train_type"
                    defaultValue={formDefaults.train_type}
                    required
                    disabled={!canEditFields && mode === "edit"}
                  >
                    <SelectTrigger id="train_type">
                      <SelectValue
                        placeholder={t("fields.train_type_placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAIN_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="delay_type">{t("fields.delay_type")}</Label>
                  <Select
                    name="delay_type"
                    defaultValue={formDefaults.delay_type}
                    required
                    disabled={!canEditFields && mode === "edit"}
                  >
                    <SelectTrigger id="delay_type">
                      <SelectValue
                        placeholder={t("fields.delay_type_placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {DELAY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="station">{t("fields.station")}</Label>
                  <SearchableSelect
                    name="station"
                    value={stationValue}
                    onValueChange={setStationValue}
                    disabled={!canEditFields && mode === "edit"}
                    placeholder={t("fields.station_placeholder")}
                    searchable={true}
                    options={STATION_OPTIONS}
                  />
                </div>

                <FormField
                  id="delay_time"
                  name="delay_time"
                  label={t("fields.delay_time")}
                  type="number"
                  defaultValue={formDefaults.delay_time}
                  placeholder={t("fields.delay_time_placeholder")}
                  required
                  min="0"
                  step="1"
                />

                <div>
                  <Label htmlFor="group_reason">
                    {t("fields.group_reason")}
                  </Label>
                  <Select
                    name="group_reason"
                    defaultValue={formDefaults.group_reason}
                    required
                    disabled={!canEditFields && mode === "edit"}
                  >
                    <SelectTrigger id="group_reason">
                      <SelectValue
                        placeholder={t("fields.group_reason_placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_REASON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <OrganizationSelectField
                  name="responsible_org"
                  defaultValue={formDefaults.responsible_org}
                  organizations={organizationsData || []}
                  isLoading={isLoadingOrganizations}
                  disabled={!canEditFields && mode === "edit"}
                />

                <FormField
                  id="damage_amount"
                  name="damage_amount"
                  label={t("fields.damage_amount")}
                  type="number"
                  defaultValue={formDefaults.damage_amount}
                  placeholder="0"
                  required
                  min="0"
                  step="0.01"
                />

                <DatePicker
                  label={t("fields.incident_date")}
                  value={selectedDate}
                  onValueChange={setSelectedDate}
                  placeholder="DD/MM/YYYY"
                />

                {(canChangeStatus || canChangeStatusAdmin) && (
                  <div className="w-full flex-1">
                    <Label htmlFor="status">{t("fields.status")}</Label>
                    <Select name="status" defaultValue={formDefaults.status}>
                      <SelectTrigger className="mb-0 w-full" id="status">
                        <SelectValue
                          placeholder={t("fields.status_placeholder")}
                        />
                      </SelectTrigger>
                      <SelectContent className="mb-0">
                        <SelectItem value="true">
                          {t("fields.status_disruption")}
                        </SelectItem>
                        <SelectItem value="false">
                          {t("fields.status_no_disruption")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          {!isModerateMode && (
            <FormField
              id="reason"
              name="reason"
              label={t("fields.reason")}
              type="textarea"
              rows={4}
              defaultValue={formDefaults.reason}
              placeholder={t("fields.reason_placeholder")}
              required
            />
          )}

          {canUploadReport && (
            <>
              {(canChangeStatus || canChangeStatusAdmin) && (
                <div className="w-full flex-1">
                  <Label htmlFor="status">{t("fields.status")}</Label>
                  <Select name="status" defaultValue={formDefaults.status}>
                    <SelectTrigger className="mb-0 w-full" id="status">
                      <SelectValue
                        placeholder={t("fields.status_placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent className="mb-0">
                      <SelectItem value="true">
                        {t("fields.status_disruption")}
                      </SelectItem>
                      <SelectItem value="false">
                        {t("fields.status_no_disruption")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <FileUpload
                  label={t("fields.report_file")}
                  filesUploaded={reportFile ? [reportFile] : []}
                  onFilesChange={(files) => setReportFile(files[0] || null)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple={false}
                  maxSize={10}
                />
                {!reportFile && entry?.report && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">
                      {t("fields.current_report")}
                    </p>
                    <a
                      href={entry.report}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      {entry.report_filename || t("fields.view_report")}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? modalTexts.pending : modalTexts.submit}
            </Button>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
