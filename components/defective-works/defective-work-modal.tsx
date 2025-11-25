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
  DefectiveWorkEntry,
  DefectiveWorkCreatePayload,
  DefectiveWorkUpdatePayload,
} from "@/api/types/defective-works";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { LocomotiveData } from "@/api/types/locomotive";
import { InspectionType } from "@/api/types/inspectionTypes";
import { useSnackbar } from "@/providers/snackbar-provider";

type LocomotiveOption = {
  id: number;
  label: string;
  value: string;
};

interface DefectiveWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload: DefectiveWorkCreatePayload | DefectiveWorkUpdatePayload
  ) => void;
  entry?: DefectiveWorkEntry | null;
  mode: "create" | "edit";
  isPending: boolean;
}

type FormData = {
  locomotive: string;
  inspection_type: string;
  train_driver: string;
  table_number: string;
  issue: string;
  code: string;
};

const INITIAL_FORM_DATA: FormData = {
  locomotive: "",
  inspection_type: "",
  train_driver: "",
  table_number: "",
  issue: "",
  code: "",
};

function LocomotiveSelectField({
  value,
  name,
  onChange,
  locomotives,
  isLoading,
}: {
  value?: string;
  name: string;
  onChange?: (value: string) => void;
  locomotives: LocomotiveData[];
  isLoading: boolean;
}) {
  return (
    <div>
      <Label htmlFor="locomotive">Lokomotiv</Label>
      <Select
        name={name}
        value={value}
        onValueChange={onChange}
        disabled={isLoading}
      >
        <SelectTrigger id="locomotive">
          <SelectValue placeholder="Lokomotivni tanlang" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              Yuklanmoqda...
            </SelectItem>
          ) : locomotives.length ? (
            locomotives.map((option) => (
              <SelectItem key={option.id} value={option.id.toString()}>
                {`${option.name} (${option.model_name})`}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="empty" disabled>
              Lokomotivlar topilmadi
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

function InspectionTypesSelectField({
  name,
  inspectionTypes,
  isLoading,
}: {
  name: string;
  inspectionTypes: InspectionType[];
  isLoading: boolean;
}) {
  return (
    <div>
      <Label htmlFor="inspection-types">Texnik ko'rik turi</Label>
      <Select name={name} disabled={isLoading}>
        <SelectTrigger id="inspection-types">
          <SelectValue placeholder="Texnik ko'rik turini tanlang" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              Yuklanmoqda...
            </SelectItem>
          ) : inspectionTypes.length ? (
            inspectionTypes.map((option) => (
              <SelectItem key={option.id} value={option.id.toString()}>
                {option.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="empty" disabled>
              Texnik ko'rik turlari topilmadi
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DefectiveWorkModal({
  isOpen,
  onClose,
  onSave,
  entry,
  mode,
  isPending,
}: DefectiveWorkModalProps) {
  const [formDefaults, setFormDefaults] = useState<FormData>(INITIAL_FORM_DATA);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { showError } = useSnackbar();

  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives(isOpen);

  const { data: inspectionTypes, isPending: isLoadingInspectionTypes } =
    useGetInspectionTypes(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    if (entry && mode === "edit") {
      const defaults = {
        locomotive: entry.locomotive ? String(entry.locomotive) : "",
        inspection_type: entry.inspection_type
          ? String(entry.inspection_type)
          : "",
        train_driver: entry.train_driver ?? "",
        table_number: entry.table_number ?? "",
        issue: entry.issue ?? "",
        code: entry.code ?? "",
      };
      setFormDefaults(defaults);
      setSelectedDate(entry.date ? new Date(entry.date) : undefined);
    } else {
      setFormDefaults(INITIAL_FORM_DATA);
    }
    setFormKey((prev) => prev + 1);
  }, [entry, mode, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const formElement = event.currentTarget as HTMLFormElement;
    const data = new FormData(formElement);
    const locomotive = (data.get("locomotive") as string) || "";
    const inspectionType = (data.get("inspection_type") as string) || "";
    const trainDriver = (data.get("train_driver") as string) || "";
    const tableNumber = (data.get("table_number") as string) || "";
    const issue = (data.get("issue") as string) || "";
    const code = (data.get("code") as string) || "";
    if (!locomotive || !inspectionType) {
      showError("Lokomotiv yoki texnik ko'rik turi tanlanmagan");
      return;
    }

    const payload = {
      locomotive: Number(locomotive),
      inspection_type: Number(inspectionType),
      train_driver: trainDriver.trim(),
      table_number: tableNumber.trim(),
      issue: issue.trim(),
      code: code.trim(),
      date: selectedDate?.toISOString() || "",
    };

    onSave(payload);
  };

  const handleClose = () => {
    setFormDefaults(INITIAL_FORM_DATA);
    setSelectedDate(undefined);
    setFormKey((prev) => prev + 1);
    formRef.current?.reset();
    onClose();
  };

  const modalTexts = useMemo(
    () => ({
      title:
        mode === "create" ? "Nosoz ishni qo'shish" : "Nosoz ishni tahrirlash",
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
      ariaDescribedBy="defective-works-modal"
    >
      <Card className="border-none p-0 mt-4">
        <form
          key={formKey}
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LocomotiveSelectField
              name="locomotive"
              locomotives={locomotivesData || []}
              isLoading={isLoadingLocomotives}
            />

            <InspectionTypesSelectField
              name="inspection_type"
              inspectionTypes={inspectionTypes || []}
              isLoading={isLoadingInspectionTypes}
            />

            <FormField
              id="train_driver"
              name="train_driver"
              label="Mashinist"
              defaultValue={formDefaults.train_driver}
              placeholder="Mashinist ism familiyasi"
              required
            />

            <FormField
              id="table_number"
              name="table_number"
              label="Jadval raqami"
              defaultValue={formDefaults.table_number}
              placeholder="Jadval raqamini kiriting"
              required
            />

            <FormField
              id="code"
              name="code"
              label="Kod"
              defaultValue={formDefaults.code}
              placeholder="Kod kiriting"
              required
            />

            <DatePicker
              label="Sana"
              value={selectedDate}
              onValueChange={setSelectedDate}
              placeholder="DD/MM/YYYY"
            />
          </div>

          <FormField
            id="issue"
            name="issue"
            label="Nosozlik tavsifi"
            type="textarea"
            rows={4}
            defaultValue={formDefaults.issue}
            placeholder="Nosozlikni tavsiflang"
            required
          />

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
