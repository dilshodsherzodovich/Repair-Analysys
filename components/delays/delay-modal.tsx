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
  return (
    <div>
      <Label htmlFor="responsible_org">Mas'ul tashkilot</Label>
      <Select
        name={name}
        defaultValue={defaultValue}
        disabled={isLoading || disabled}
      >
        <SelectTrigger id="responsible_org">
          <SelectValue placeholder="Tashkilotni tanlang" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              Yuklanmoqda...
            </SelectItem>
          ) : organizations.length ? (
            organizations.map((org) => (
              <SelectItem key={org.id} value={String(org.id)}>
                {org.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="empty" disabled>
              Tashkilotlar topilmadi
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
        entry.incident_date ? new Date(entry.incident_date) : undefined
      );
      setReportFile(null); // Don't pre-fill file on edit
    } else {
      setFormDefaults(INITIAL_FORM_DATA);
      setSelectedDate(undefined);
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
      showError("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }

    if (mode === "create" && (!groupReason || !trainType)) {
      showError("Iltimos, guruh sababi va poyezd turini tanlang");
      return;
    }

    if (!delayTimeMinutes || isNaN(Number(delayTimeMinutes)) || Number(delayTimeMinutes) < 0) {
      showError("Iltimos, kechikish vaqtini daqiqalarda kiriting");
      return;
    }

    if (!selectedDate) {
      showError("Iltimos, voqea sanasini tanlang");
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
    setReportFile(null);
    setFormKey((prev) => prev + 1);
    formRef.current?.reset();
    onClose();
  };

  const modalTexts = useMemo(
    () => ({
      title:
        mode === "create"
          ? "Kechikish qo'shish"
          : mode === "moderate"
            ? "Kechikishni boshqarish"
            : "Kechikishni tahrirlash",
      submit: mode === "create" ? "Qo'shish" : "Saqlash",
      pending: mode === "create" ? "Qo'shilmoqda..." : "Saqlanmoqda...",
    }),
    [mode]
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
                  label="Poyezd raqami"
                  defaultValue={formDefaults.train_number}
                  placeholder="Poyezd raqamini kiriting"
                  required
                />

                <div>
                  <Label htmlFor="train_type">Poyezd turi</Label>
                  <Select
                    name="train_type"
                    defaultValue={formDefaults.train_type}
                    required
                    disabled={!canEditFields && mode === "edit"}
                  >
                    <SelectTrigger id="train_type">
                      <SelectValue placeholder="Poyezd turini tanlang" />
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
                  <Label htmlFor="delay_type">Kechikish turi</Label>
                  <Select
                    name="delay_type"
                    defaultValue={formDefaults.delay_type}
                    required
                    disabled={!canEditFields && mode === "edit"}
                  >
                    <SelectTrigger id="delay_type">
                      <SelectValue placeholder="Kechikish turini tanlang" />
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
                  <Label htmlFor="station">Stansiya</Label>
                  <Select
                    name="station"
                    defaultValue={formDefaults.station}
                    required
                    disabled={!canEditFields && mode === "edit"}
                  >
                    <SelectTrigger id="station">
                      <SelectValue placeholder="Stansiyani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  id="delay_time"
                  name="delay_time"
                  label="Kechikish vaqti (daqiqalar)"
                  type="number"
                  defaultValue={formDefaults.delay_time}
                  placeholder="Masalan: 72 (1 soat 12 daqiqa)"
                  required
                  min="0"
                  step="1"
                />



                <div>
                  <Label htmlFor="group_reason">Guruh</Label>
                  <Select
                    name="group_reason"
                    defaultValue={formDefaults.group_reason}
                    required
                    disabled={!canEditFields && mode === "edit"}
                  >
                    <SelectTrigger id="group_reason">
                      <SelectValue placeholder="Guruh sababini tanlang" />
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
                  label="Zarar miqdori"
                  type="number"
                  defaultValue={formDefaults.damage_amount}
                  placeholder="0"
                  required
                  min="0"
                  step="0.01"
                />

                <DatePicker
                  label="Voqea sanasi"
                  value={selectedDate}
                  onValueChange={setSelectedDate}
                  placeholder="DD/MM/YYYY"
                />

                {(canChangeStatus || canChangeStatusAdmin) && (
                  <div className="w-full flex-1">
                    <Label htmlFor="status">Holat</Label>
                    <Select name="status" defaultValue={formDefaults.status}>
                      <SelectTrigger className="mb-0 w-full" id="status">
                        <SelectValue placeholder="Holatni tanlang" />
                      </SelectTrigger>
                      <SelectContent className="mb-0">
                        <SelectItem value="true">Sriv</SelectItem>
                        <SelectItem value="false">Sriv emas</SelectItem>
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
              label="Sabab"
              type="textarea"
              rows={4}
              defaultValue={formDefaults.reason}
              placeholder="Kechikish sababini kiriting"
              required
            />
          )}

          {canUploadReport && (
            <>
              {(canChangeStatus || canChangeStatusAdmin) && (
                <div className="w-full flex-1">
                  <Label htmlFor="status">Holat</Label>
                  <Select name="status" defaultValue={formDefaults.status}>
                    <SelectTrigger className="mb-0 w-full" id="status">
                      <SelectValue placeholder="Holatni tanlang" />
                    </SelectTrigger>
                    <SelectContent className="mb-0">
                      <SelectItem value="true">Sriv</SelectItem>
                      <SelectItem value="false">Sriv emas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <FileUpload
                  label="Hisobot fayli"
                  filesUploaded={reportFile ? [reportFile] : []}
                  onFilesChange={(files) => setReportFile(files[0] || null)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple={false}
                  maxSize={10}
                />
                {!reportFile && entry?.report && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Joriy hisobot:</p>
                    <a
                      href={entry.report}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      {entry.report_filename || "Hisobotni ko'rish"}
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
              Bekor qilish
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
