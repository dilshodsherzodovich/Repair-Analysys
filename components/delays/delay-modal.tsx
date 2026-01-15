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
import {
  DelayEntry,
  DelayCreatePayload,
  DelayUpdatePayload,
  DELAY_TYPE_OPTIONS,
  STATION_OPTIONS,
} from "@/api/types/delays";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useSnackbar } from "@/providers/snackbar-provider";
import { hasPermission } from "@/lib/permissions";
import type { UserData } from "@/api/types/auth";

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
  delay_time: string;
  reason: string;
  damage_amount: string;
  responsible_org: string;
  status: string;
};

const INITIAL_FORM_DATA: FormData = {
  delay_type: "",
  train_number: "",
  station: "",
  delay_time: "",
  reason: "",
  damage_amount: "0",
  responsible_org: "",
  status: "true",
};

function OrganizationSelectField({
  name,
  defaultValue,
  organizations,
  isLoading,
  disabled,
}: {
  name: string;
  defaultValue?: string;
  organizations: Array<{ id: number; name: string; name_uz?: string }>;
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
              <SelectItem key={org.id} value={org.id.toString()}>
                {org.name_uz || org.name}
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
  const canUploadReport = hasPermission(user ?? null, "upload_delay_report");
  const canChangeStatus = hasPermission(user ?? null, "upload_delay_report");
  const canEditFields =
    hasPermission(user ?? null, "edit_delay") &&
    !hasPermission(user ?? null, "upload_delay_report");
  const isModerateMode = mode === "moderate";
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

    if (entry && mode === "edit") {
      // Parse delay_time (format: "HH:mm:ss" or "HH:mm")
      const timeStr = entry.delay_time || "";
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
      const formattedTime = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : "";

      const defaults = {
        delay_type: entry.delay_type || "",
        train_number: entry.train_number || "",
        station: entry.station || "",
        delay_time: formattedTime,
        reason: entry.reason || "",
        damage_amount: String(entry.damage_amount || 0),
        responsible_org: entry.responsible_org
          ? String(entry.responsible_org)
          : "",
        status: entry.status ? "true" : "false",
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
    setFormKey((prev) => prev + 1);
  }, [entry, mode, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const formElement = event.currentTarget as HTMLFormElement;
    const data = new FormData(formElement);

    if (isModerateMode) {
      // In moderate mode, only status (set to false) and report can be changed
      // Status defaults to false (closed) when moderator clicks "Yopish"
      const payload: DelayUpdatePayload = {
        status: false, // Always set to false (closed) when moderator closes the delay
        ...(canUploadReport && reportFile && { report: reportFile }),
      };
      onSave(payload);
      return;
    }

    const delayType = (data.get("delay_type") as string) || "";
    const trainNumber = (data.get("train_number") as string) || "";
    const station = (data.get("station") as string) || "";
    const delayTime = (data.get("delay_time") as string) || "";
    const reason = (data.get("reason") as string) || "";
    const damageAmount = (data.get("damage_amount") as string) || "0";
    const responsibleOrg = (data.get("responsible_org") as string) || "";
    const status = (data.get("status") as string) === "true";

    if (!delayType || !trainNumber || !station || !responsibleOrg) {
      showError("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }

    if (!selectedDate) {
      showError("Iltimos, voqea sanasini tanlang");
      return;
    }

    // Format date as YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split("T")[0];

    // Format time - ensure it's in HH:mm format
    const timeParts = delayTime.split(":");
    const formattedTime =
      timeParts.length >= 2
        ? `${timeParts[0].padStart(2, "0")}:${timeParts[1].padStart(2, "0")}`
        : delayTime;

    const payload: DelayCreatePayload | DelayUpdatePayload = {
      delay_type: delayType as "Po prosledovaniyu" | "Po otpravleniyu",
      train_number: trainNumber.trim(),
      station: station.trim(),
      delay_time: formattedTime,
      reason: reason.trim(),
      damage_amount: Number.parseFloat(damageAmount) || 0,
      responsible_org: Number(responsibleOrg),
      incident_date: formattedDate,
      ...(canChangeStatus && { status }),
      ...(canUploadReport && reportFile && { report: reportFile }),
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

                <FormField
                  id="train_number"
                  name="train_number"
                  label="Poyezd raqami"
                  defaultValue={formDefaults.train_number}
                  placeholder="Poyezd raqamini kiriting"
                  required
                />

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
                  label="Kechikish vaqti"
                  type="time"
                  defaultValue={formDefaults.delay_time}
                  placeholder="HH:mm"
                  required
                />

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
              </>
            )}

            {canChangeStatus && !isModerateMode && (
              <div>
                <Label htmlFor="status">Holati</Label>
                <Select name="status" defaultValue={formDefaults.status}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Holatni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Faol</SelectItem>
                    <SelectItem value="false">Nofaol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <div>
              <FileUpload
                label="Hisobot fayli"
                filesUploaded={reportFile ? [reportFile] : []}
                onFilesChange={(files) => setReportFile(files[0] || null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                multiple={false}
                maxSize={10}
                hint="PDF, Word yoki Excel fayl yuklash mumkin (maksimal 10MB)"
              />
            </div>
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
