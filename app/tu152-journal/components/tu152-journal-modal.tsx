"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Flame, Camera, Stamp, ClipboardList, Fuel, Check, Plus } from "lucide-react";

import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Button } from "@/ui/button";
import { DatePicker } from "@/ui/date-picker";
import { DateTimePicker } from "@/ui/datetime-picker";
import { Switch } from "@/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SearchableSelect,
} from "@/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useInspectionTypes } from "@/api/hooks/use-inspection";
import {
  CombinedJournalEntry,
  CombinedJournalPayload,
  EnergyTypeBlock,
  EnergyTypeOfJournal,
  StampAuthorizedBy,
} from "@/api/types/tu152-journal";
import { cn } from "@/lib/utils";

interface Tu152JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CombinedJournalPayload) => void;
  isPending: boolean;
  editData?: CombinedJournalEntry;
  organizationId?: number;
}

interface EnergyState {
  enabled: boolean;
  type_of_journal: EnergyTypeOfJournal;
  weight_of_fuel: string;
  kv_electricity: string;
  date_of_receipt?: Date;
  receiver: string;
  sender: string;
}

interface FireExtState {
  enabled: boolean;
  name: string;
  count: string;
  receiver: string;
  sender: string;
}

interface CameraState {
  enabled: boolean;
  name: string;
  count: string;
  receiver: string;
  sender: string;
}

interface StampState {
  enabled: boolean;
  red_stamp: boolean;
  green_stamp: boolean;
  stamp_applied_at?: Date;
  authorized_by: StampAuthorizedBy | "";
}

interface RevisionState {
  enabled: boolean;
  inspection_type: string;
  train_driver: string;
  table_number: string;
  issue: string;
  code: string;
  date?: Date;
}

const ENERGY_INITIAL: EnergyState = {
  enabled: false,
  type_of_journal: "NONE_TYPE",
  weight_of_fuel: "",
  kv_electricity: "",
  date_of_receipt: undefined,
  receiver: "",
  sender: "",
};
const FIRE_INITIAL: FireExtState = {
  enabled: false,
  name: "",
  count: "",
  receiver: "",
  sender: "",
};
const CAMERA_INITIAL: CameraState = {
  enabled: false,
  name: "",
  count: "",
  receiver: "",
  sender: "",
};
const STAMP_INITIAL: StampState = {
  enabled: false,
  red_stamp: false,
  green_stamp: false,
  stamp_applied_at: undefined,
  authorized_by: "",
};
const REVISION_INITIAL: RevisionState = {
  enabled: false,
  inspection_type: "",
  train_driver: "",
  table_number: "",
  issue: "",
  code: "",
  date: undefined,
};

function parseApiDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return isNaN(d.getTime()) ? undefined : d;
}

export function Tu152JournalModal({
  isOpen,
  onClose,
  onSave,
  isPending,
  editData,
  organizationId,
}: Tu152JournalModalProps) {
  const t = useTranslations("Tu152JournalModal");

  const [locomotiveId, setLocomotiveId] = useState<string>("");
  const [energy, setEnergy] = useState<EnergyState>(ENERGY_INITIAL);
  const [fire, setFire] = useState<FireExtState>(FIRE_INITIAL);
  const [camera, setCamera] = useState<CameraState>(CAMERA_INITIAL);
  const [stamp, setStamp] = useState<StampState>(STAMP_INITIAL);
  const [revision, setRevision] = useState<RevisionState>(REVISION_INITIAL);
  const [error, setError] = useState<string>("");

  const { data: locomotivesData, isPending: loadingLocomotives } =
    useGetLocomotives(isOpen, undefined, {
      no_page: true,
      organization: organizationId,
    });

  const { data: inspectionTypesData, isPending: loadingInspectionTypes } =
    useInspectionTypes(isOpen);

  const locomotiveOptions = useMemo(
    () =>
      locomotivesData?.results?.map((loc) => ({
        value: String(loc.id),
        label: `${loc.name}${loc.model_name ? ` - ${loc.model_name}` : ""}`,
      })) ?? [],
    [locomotivesData],
  );

  const inspectionOptions = useMemo(
    () =>
      inspectionTypesData?.map((ins) => ({
        value: String(ins.id),
        label: ins.name_uz || ins.name,
      })) ?? [],
    [inspectionTypesData],
  );

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    if (editData) {
      setLocomotiveId(editData.locomotive_id ? String(editData.locomotive_id) : "");
      if (editData.energy_type) {
        setEnergy({
          enabled: true,
          type_of_journal:
            editData.energy_type.type_of_journal ?? "NONE_TYPE",
          weight_of_fuel:
            editData.energy_type.weight_of_fuel != null
              ? String(editData.energy_type.weight_of_fuel)
              : "",
          kv_electricity:
            editData.energy_type.kv_electricity != null
              ? String(editData.energy_type.kv_electricity)
              : "",
          date_of_receipt: parseApiDate(editData.energy_type.date_of_receipt),
          receiver: editData.energy_type.receiver ?? "",
          sender: editData.energy_type.sender ?? "",
        });
      } else {
        setEnergy(ENERGY_INITIAL);
      }

      if (editData.fire_extinguisher) {
        setFire({
          enabled: true,
          name: editData.fire_extinguisher.name ?? "",
          count:
            editData.fire_extinguisher.count != null
              ? String(editData.fire_extinguisher.count)
              : "",
          receiver: editData.fire_extinguisher.receiver ?? "",
          sender: editData.fire_extinguisher.sender ?? "",
        });
      } else {
        setFire(FIRE_INITIAL);
      }

      if (editData.camera_receipt) {
        setCamera({
          enabled: true,
          name: editData.camera_receipt.name ?? "",
          count:
            editData.camera_receipt.count != null
              ? String(editData.camera_receipt.count)
              : "",
          receiver: editData.camera_receipt.receiver ?? "",
          sender: editData.camera_receipt.sender ?? "",
        });
      } else {
        setCamera(CAMERA_INITIAL);
      }

      if (editData.stamp) {
        setStamp({
          enabled: true,
          red_stamp: Boolean(editData.stamp.red_stamp),
          green_stamp: Boolean(editData.stamp.green_stamp),
          stamp_applied_at: parseApiDate(editData.stamp.stamp_applied_at),
          authorized_by: (editData.stamp.authorized_by ?? "") as
            | StampAuthorizedBy
            | "",
        });
      } else {
        setStamp(STAMP_INITIAL);
      }

      if (editData.revision_journal) {
        setRevision({
          enabled: true,
          inspection_type:
            editData.revision_journal.inspection_type != null
              ? String(editData.revision_journal.inspection_type)
              : "",
          train_driver: editData.revision_journal.train_driver ?? "",
          table_number: editData.revision_journal.table_number ?? "",
          issue: editData.revision_journal.issue ?? "",
          code: editData.revision_journal.code ?? "",
          date: parseApiDate(editData.revision_journal.date),
        });
      } else {
        setRevision(REVISION_INITIAL);
      }
    } else {
      setLocomotiveId("");
      setEnergy(ENERGY_INITIAL);
      setFire(FIRE_INITIAL);
      setCamera(CAMERA_INITIAL);
      setStamp(STAMP_INITIAL);
      setRevision(REVISION_INITIAL);
    }
  }, [isOpen, editData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!locomotiveId) {
      setError(t("error_locomotive_required"));
      return;
    }

    const anyEnabled =
      energy.enabled ||
      fire.enabled ||
      camera.enabled ||
      stamp.enabled ||
      revision.enabled;

    if (!anyEnabled && !editData) {
      setError(t("error_at_least_one"));
      return;
    }

    const payload: CombinedJournalPayload = {
      locomotive_id: Number(locomotiveId),
    };

    if (energy.enabled) {
      const block: EnergyTypeBlock = {
        type_of_journal: energy.type_of_journal,
        date_of_receipt: energy.date_of_receipt
          ? format(energy.date_of_receipt, "yyyy-MM-dd")
          : null,
        receiver: energy.receiver.trim() || null,
        sender: energy.sender.trim() || null,
        weight_of_fuel:
          energy.type_of_journal === "FUEL" && energy.weight_of_fuel
            ? Number(energy.weight_of_fuel)
            : null,
        kv_electricity:
          energy.type_of_journal === "ELECTRICITY" && energy.kv_electricity
            ? Number(energy.kv_electricity)
            : null,
      };
      payload.energy_type = block;
    } else if (editData?.energy_type) {
      payload.energy_type = null;
    }

    if (fire.enabled) {
      payload.fire_extinguisher = {
        name: fire.name.trim() || null,
        count: fire.count ? Number(fire.count) : null,
        receiver: fire.receiver.trim() || null,
        sender: fire.sender.trim() || null,
      };
    } else if (editData?.fire_extinguisher) {
      payload.fire_extinguisher = null;
    }

    if (camera.enabled) {
      payload.camera_receipt = {
        name: camera.name.trim() || null,
        count: camera.count ? Number(camera.count) : null,
        receiver: camera.receiver.trim() || null,
        sender: camera.sender.trim() || null,
      };
    } else if (editData?.camera_receipt) {
      payload.camera_receipt = null;
    }

    if (stamp.enabled) {
      payload.stamp = {
        red_stamp: stamp.red_stamp,
        green_stamp: stamp.green_stamp,
        stamp_applied_at: stamp.stamp_applied_at
          ? format(stamp.stamp_applied_at, "yyyy-MM-dd")
          : null,
        authorized_by: stamp.authorized_by || null,
      };
    } else if (editData?.stamp) {
      payload.stamp = null;
    }

    if (revision.enabled) {
      payload.revision_journal = {
        inspection_type: revision.inspection_type
          ? Number(revision.inspection_type)
          : null,
        train_driver: revision.train_driver.trim() || null,
        table_number: revision.table_number.trim() || null,
        issue: revision.issue.trim() || null,
        code: revision.code.trim() || null,
        date: revision.date ? revision.date.toISOString() : null,
      };
    } else if (editData?.revision_journal) {
      payload.revision_journal = null;
    }

    onSave(payload);
  };

  const tabs = [
    { value: "energy", label: t("tab_energy"), icon: Fuel, enabled: energy.enabled },
    { value: "fire", label: t("tab_fire"), icon: Flame, enabled: fire.enabled },
    { value: "camera", label: t("tab_camera"), icon: Camera, enabled: camera.enabled },
    { value: "stamp", label: t("tab_stamp"), icon: Stamp, enabled: stamp.enabled },
    { value: "revision", label: t("tab_revision"), icon: ClipboardList, enabled: revision.enabled },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:!max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? t("title_edit") : t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="locomotive_id">
              {t("locomotive")} <span className="text-red-500 ml-1">*</span>
            </Label>
            <SearchableSelect
              value={locomotiveId}
              onValueChange={setLocomotiveId}
              options={locomotiveOptions}
              placeholder={
                loadingLocomotives
                  ? t("placeholder_loading")
                  : t("placeholder_locomotive")
              }
              searchable
              searchPlaceholder={t("search_locomotive")}
              emptyMessage={t("no_results")}
              disabled={loadingLocomotives || isPending || Boolean(editData)}
              triggerClassName="w-full mb-0"
            />
          </div>

          <Tabs defaultValue="energy" className="w-full">
            <TabsList className="flex flex-wrap gap-1 bg-slate-100 p-1 w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex-1 min-w-[120px] gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{tab.label}</span>
                    {tab.enabled && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* ENERGY TYPE */}
            <TabsContent value="energy" className="pt-4">
              <SectionToggle
                title={t("section_energy_title")}
                description={t("section_energy_desc")}
                enabled={energy.enabled}
                onToggle={(v) =>
                  setEnergy((prev) => ({ ...prev, enabled: v }))
                }
                disabled={isPending}
              />
              {energy.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>{t("energy_type")}</Label>
                    <Select
                      value={energy.type_of_journal}
                      onValueChange={(v) =>
                        setEnergy((prev) => ({
                          ...prev,
                          type_of_journal: v as EnergyTypeOfJournal,
                        }))
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("energy_type")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FUEL">{t("energy_fuel")}</SelectItem>
                        <SelectItem value="ELECTRICITY">
                          {t("energy_electricity")}
                        </SelectItem>
                        <SelectItem value="NONE_TYPE">
                          {t("energy_none")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {energy.type_of_journal === "FUEL" && (
                    <div>
                      <Label>{t("energy_weight")}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={energy.weight_of_fuel}
                        onChange={(e) =>
                          setEnergy((prev) => ({
                            ...prev,
                            weight_of_fuel: e.target.value,
                          }))
                        }
                        placeholder={t("energy_weight_placeholder")}
                        disabled={isPending}
                      />
                    </div>
                  )}

                  {energy.type_of_journal === "ELECTRICITY" && (
                    <div>
                      <Label>{t("energy_kv")}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={energy.kv_electricity}
                        onChange={(e) =>
                          setEnergy((prev) => ({
                            ...prev,
                            kv_electricity: e.target.value,
                          }))
                        }
                        placeholder={t("energy_kv_placeholder")}
                        disabled={isPending}
                      />
                    </div>
                  )}

                  <div>
                    <Label>{t("date_of_receipt")}</Label>
                    <DatePicker
                      value={energy.date_of_receipt}
                      onValueChange={(d) =>
                        setEnergy((prev) => ({ ...prev, date_of_receipt: d }))
                      }
                      placeholder={t("placeholder_date")}
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <Label>{t("receiver")}</Label>
                    <Input
                      value={energy.receiver}
                      onChange={(e) =>
                        setEnergy((prev) => ({
                          ...prev,
                          receiver: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_full_name")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("sender")}</Label>
                    <Input
                      value={energy.sender}
                      onChange={(e) =>
                        setEnergy((prev) => ({
                          ...prev,
                          sender: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_full_name")}
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* FIRE EXTINGUISHER */}
            <TabsContent value="fire" className="pt-4">
              <SectionToggle
                title={t("section_fire_title")}
                description={t("section_fire_desc")}
                enabled={fire.enabled}
                onToggle={(v) =>
                  setFire((prev) => ({ ...prev, enabled: v }))
                }
                disabled={isPending}
              />
              {fire.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>{t("fire_name")}</Label>
                    <Input
                      value={fire.name}
                      onChange={(e) =>
                        setFire((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder={t("fire_name_placeholder")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("count")}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={fire.count}
                      onChange={(e) =>
                        setFire((prev) => ({ ...prev, count: e.target.value }))
                      }
                      placeholder={t("count_placeholder")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("receiver")}</Label>
                    <Input
                      value={fire.receiver}
                      onChange={(e) =>
                        setFire((prev) => ({
                          ...prev,
                          receiver: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_full_name")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("sender")}</Label>
                    <Input
                      value={fire.sender}
                      onChange={(e) =>
                        setFire((prev) => ({
                          ...prev,
                          sender: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_full_name")}
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* CAMERA */}
            <TabsContent value="camera" className="pt-4">
              <SectionToggle
                title={t("section_camera_title")}
                description={t("section_camera_desc")}
                enabled={camera.enabled}
                onToggle={(v) =>
                  setCamera((prev) => ({ ...prev, enabled: v }))
                }
                disabled={isPending}
              />
              {camera.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>{t("camera_name")}</Label>
                    <Input
                      value={camera.name}
                      onChange={(e) =>
                        setCamera((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder={t("camera_name_placeholder")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("count")}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={camera.count}
                      onChange={(e) =>
                        setCamera((prev) => ({
                          ...prev,
                          count: e.target.value,
                        }))
                      }
                      placeholder={t("count_placeholder")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("receiver")}</Label>
                    <Input
                      value={camera.receiver}
                      onChange={(e) =>
                        setCamera((prev) => ({
                          ...prev,
                          receiver: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_full_name")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("sender")}</Label>
                    <Input
                      value={camera.sender}
                      onChange={(e) =>
                        setCamera((prev) => ({
                          ...prev,
                          sender: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_full_name")}
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* STAMP */}
            <TabsContent value="stamp" className="pt-4">
              <SectionToggle
                title={t("section_stamp_title")}
                description={t("section_stamp_desc")}
                enabled={stamp.enabled}
                onToggle={(v) =>
                  setStamp((prev) => ({ ...prev, enabled: v }))
                }
                disabled={isPending}
              />
              {stamp.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-500" />
                      <Label className="m-0">{t("red_stamp")}</Label>
                    </div>
                    <Switch
                      checked={stamp.red_stamp}
                      onCheckedChange={(v) =>
                        setStamp((prev) => ({ ...prev, red_stamp: v }))
                      }
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      <Label className="m-0">{t("green_stamp")}</Label>
                    </div>
                    <Switch
                      checked={stamp.green_stamp}
                      onCheckedChange={(v) =>
                        setStamp((prev) => ({ ...prev, green_stamp: v }))
                      }
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("stamp_applied_at")}</Label>
                    <DatePicker
                      value={stamp.stamp_applied_at}
                      onValueChange={(d) =>
                        setStamp((prev) => ({ ...prev, stamp_applied_at: d }))
                      }
                      placeholder={t("placeholder_date")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("authorized_by")}</Label>
                    <Select
                      value={stamp.authorized_by}
                      onValueChange={(v) =>
                        setStamp((prev) => ({
                          ...prev,
                          authorized_by: v as StampAuthorizedBy,
                        }))
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("placeholder_authorized_by")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KIP">KIP</SelectItem>
                        <SelectItem value="ERB">ERB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* REVISION */}
            <TabsContent value="revision" className="pt-4">
              <SectionToggle
                title={t("section_revision_title")}
                description={t("section_revision_desc")}
                enabled={revision.enabled}
                onToggle={(v) =>
                  setRevision((prev) => ({ ...prev, enabled: v }))
                }
                disabled={isPending}
              />
              {revision.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>{t("inspection_type")}</Label>
                    <Select
                      value={revision.inspection_type}
                      onValueChange={(v) =>
                        setRevision((prev) => ({
                          ...prev,
                          inspection_type: v,
                        }))
                      }
                      disabled={loadingInspectionTypes || isPending}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            loadingInspectionTypes
                              ? t("placeholder_loading")
                              : t("placeholder_inspection")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {inspectionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("train_driver")}</Label>
                    <Input
                      value={revision.train_driver}
                      onChange={(e) =>
                        setRevision((prev) => ({
                          ...prev,
                          train_driver: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_full_name")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("table_number")}</Label>
                    <Input
                      value={revision.table_number}
                      onChange={(e) =>
                        setRevision((prev) => ({
                          ...prev,
                          table_number: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_table_number")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>{t("revision_code")}</Label>
                    <Input
                      value={revision.code}
                      onChange={(e) =>
                        setRevision((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_revision_code")}
                      disabled={isPending}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>{t("revision_date")}</Label>
                    <DateTimePicker
                      value={revision.date}
                      onValueChange={(d) =>
                        setRevision((prev) => ({ ...prev, date: d }))
                      }
                      placeholder={t("placeholder_datetime")}
                      disabled={isPending}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>{t("revision_issue")}</Label>
                    <Textarea
                      value={revision.issue}
                      onChange={(e) =>
                        setRevision((prev) => ({
                          ...prev,
                          issue: e.target.value,
                        }))
                      }
                      placeholder={t("placeholder_issue")}
                      rows={3}
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : editData ? t("update") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SectionToggle({
  title,
  description,
  enabled,
  onToggle,
  disabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Tu152JournalModal");

  const handleToggle = () => {
    if (!disabled) onToggle(!enabled);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle(!enabled);
    }
  };

  return (
    <div
      role="switch"
      tabIndex={disabled ? -1 : 0}
      aria-checked={enabled}
      aria-disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        "group w-full select-none rounded-xl border-2 px-4 py-4 transition-all cursor-pointer",
        "outline-none focus-visible:ring-4",
        disabled && "cursor-not-allowed opacity-60",
        enabled
          ? "border-emerald-500 bg-emerald-50 shadow-sm focus-visible:ring-emerald-200"
          : "border-dashed border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white focus-visible:ring-slate-200",
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-lg font-bold transition-colors",
            enabled ? "bg-emerald-500" : "bg-slate-300",
          )}
          aria-hidden
        >
          {enabled ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <Plus className="h-5 w-5" strokeWidth={3} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-slate-800">
              {title}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                enabled
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-600",
              )}
            >
              {enabled
                ? t("section_enabled_badge")
                : t("section_disabled_badge")}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">{description}</div>
          <div
            className={cn(
              "text-xs font-semibold mt-2",
              enabled ? "text-emerald-700" : "text-slate-600",
            )}
          >
            {enabled
              ? t("section_click_to_disable")
              : t("section_click_to_enable")}
          </div>
        </div>

        {/* Visual-only switch indicator — the whole card is the actual control */}
        <span
          aria-hidden
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
            enabled
              ? "bg-emerald-500 border-emerald-600"
              : "bg-slate-200 border-slate-300",
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
              enabled ? "translate-x-6" : "translate-x-1",
            )}
          />
        </span>
      </div>
    </div>
  );
}
