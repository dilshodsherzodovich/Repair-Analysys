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
} from "@/ui/select";
import { Button } from "@/ui/button";
import { FormField } from "@/ui/form-field";
import { DatePicker } from "@/ui/date-picker";
import {
  DelayEntry,
  DelayType,
  DelayCreatePayload,
  DelayUpdatePayload,
  DELAY_TYPE_OPTIONS,
  TRAIN_TYPE_OPTIONS,
  GROUP_REASON_OPTIONS,
  TrainType,
  GroupReason,
} from "@/api/types/delays";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useSnackbar } from "@/providers/snackbar-provider";
import type { UserData } from "@/api/types/auth";
import type { Organization } from "@/api/types/organizations";
import { useTranslations } from "next-intl";

interface DelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: DelayCreatePayload | DelayUpdatePayload) => void;
  entry?: DelayEntry | null;
  mode: "create" | "edit";
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
  group_reason: string;
  train_type: string;
};

const INITIAL_FORM_DATA: FormData = {
  delay_type: "",
  train_number: "",
  station: "",
  delay_time: "",
  reason: "",
  damage_amount: "0",
  responsible_org: "",
  group_reason: "",
  train_type: "",
};

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
}

function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d{1,2})(?::(\d{2}))?/);
  if (match) {
    const hours = parseInt(match[1], 10) || 0;
    const minutes = parseInt(match[2], 10) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

function minutesToHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatDuration(raw: string): string {
  let cleaned = raw.replace(/[^\d:]/g, "");
  const firstColon = cleaned.indexOf(":");
  if (firstColon !== -1) {
    cleaned =
      cleaned.slice(0, firstColon + 1) +
      cleaned.slice(firstColon + 1).replace(/:/g, "");
    const [h, m] = cleaned.split(":");
    cleaned = `${h}:${m.slice(0, 2)}`;
  }
  return cleaned;
}

function formatThousands(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const [intPart, ...rest] = cleaned.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return rest.length ? `${grouped}.${rest.join("")}` : grouped;
}

function parseThousands(formatted: string): number {
  return Number.parseFloat(formatted.replace(/\s/g, "")) || 0;
}

function OrganizationSelectField({
  name,
  defaultValue,
  organizations,
  isLoading,
}: {
  name: string;
  defaultValue?: string;
  organizations: Organization[];
  isLoading: boolean;
}) {
  const t = useTranslations("DelayModal");

  return (
    <div>
      <Label htmlFor="responsible_org">{t("fields.responsible_org")}</Label>
      <Select name={name} defaultValue={defaultValue} disabled={isLoading}>
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
}: DelayModalProps) {
  const t = useTranslations("DelayModal");
  const [formDefaults, setFormDefaults] = useState<FormData>(INITIAL_FORM_DATA);
  const [stationValue, setStationValue] = useState<string>("");
  const [delayTimeDisplay, setDelayTimeDisplay] = useState<string>("");
  const [damageDisplay, setDamageDisplay] = useState<string>("0");
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { showError } = useSnackbar();

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  useEffect(() => {
    if (!isOpen) return;

    if (entry && mode === "edit") {
      const minutes = timeStringToMinutes(entry.delay_time || "");
      const defaults: FormData = {
        delay_type: entry.delay_type || "",
        train_number: entry.train_number || "",
        station: entry.station || "",
        delay_time: minutes > 0 ? minutesToHHMM(minutes) : "",
        reason: entry.reason || "",
        damage_amount: String(entry.damage_amount || 0),
        responsible_org: entry.responsible_org
          ? String(entry.responsible_org)
          : "",
        group_reason: entry.group_reason || "",
        train_type: entry.train_type || "",
      };
      setFormDefaults(defaults);
      setSelectedDate(
        entry.incident_date ? new Date(entry.incident_date) : undefined
      );
      setStationValue(entry.station || "");
      setDelayTimeDisplay(minutes > 0 ? minutesToHHMM(minutes) : "");
      setDamageDisplay(formatThousands(String(entry.damage_amount || 0)));
    } else {
      setFormDefaults(INITIAL_FORM_DATA);
      setSelectedDate(undefined);
      setStationValue("");
      setDelayTimeDisplay("");
      setDamageDisplay("0");
    }
    setFormKey((prev) => prev + 1);
  }, [entry, mode, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const formElement = event.currentTarget as HTMLFormElement;
    const data = new FormData(formElement);

    const delayType = (data.get("delay_type") as string) || "";
    const trainNumber = (data.get("train_number") as string) || "";
    const station = (data.get("station") as string) || "";
    const delayTimeRaw = delayTimeDisplay;
    const reason = (data.get("reason") as string) || "";
    const damageAmount = parseThousands(damageDisplay);
    const responsibleOrg = (data.get("responsible_org") as string) || "";
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

    const delayMinutes = timeStringToMinutes(delayTimeRaw);
    if (!delayTimeRaw || delayMinutes <= 0) {
      showError(t("errors.delay_time"));
      return;
    }

    if (!selectedDate) {
      showError(t("errors.incident_date"));
      return;
    }

    // Local YYYY-MM-DD (avoid UTC off-by-one)
    const formattedDate = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    const formattedTime = minutesToTimeString(delayMinutes);

    const payload: DelayCreatePayload | DelayUpdatePayload = {
      delay_type: delayType as DelayType,
      train_number: trainNumber.trim(),
      station: station.trim(),
      delay_time: formattedTime,
      reason: reason.trim(),
      damage_amount: damageAmount,
      responsible_org: Number(responsibleOrg),
      incident_date: formattedDate,
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
    setDelayTimeDisplay("");
    setDamageDisplay("0");
    setFormKey((prev) => prev + 1);
    formRef.current?.reset();
    onClose();
  };

  const modalTexts = useMemo(
    () => ({
      title: mode === "create" ? t("title_create") : t("title_edit"),
      submit: mode === "create" ? t("submit_create") : t("submit_edit"),
      pending: mode === "create" ? t("pending_create") : t("pending_edit"),
    }),
    [mode, t]
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

            <FormField
              id="station"
              name="station"
              label={t("fields.station")}
              value={stationValue}
              onChange={setStationValue}
              placeholder={t("fields.station_placeholder")}
              required
            />

            <FormField
              id="delay_time"
              name="delay_time"
              label={t("fields.delay_time")}
              type="text"
              value={delayTimeDisplay}
              onChange={(v) => setDelayTimeDisplay(formatDuration(v))}
              placeholder="hh:mm"
              required
            />

            <div>
              <Label htmlFor="group_reason">{t("fields.group_reason")}</Label>
              <Select
                name="group_reason"
                defaultValue={formDefaults.group_reason}
                required
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
            />

            <FormField
              id="damage_amount"
              name="damage_amount"
              label={t("fields.damage_amount")}
              type="text"
              value={damageDisplay}
              onChange={(v) => setDamageDisplay(formatThousands(v))}
              placeholder="0"
              required
            />

            <DatePicker
              label={t("fields.incident_date")}
              value={selectedDate}
              onValueChange={setSelectedDate}
              placeholder="DD/MM/YYYY"
            />
          </div>

          <FormField
            id="reason"
            name="reason"
            label={t("fields.reason")}
            type="textarea"
            rows={4}
            defaultValue={formDefaults.reason}
            placeholder={t("fields.reason_placeholder")}
          />

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
