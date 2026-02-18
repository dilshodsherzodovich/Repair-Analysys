"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  useRef,
  type FormEvent,
} from "react";
import { Modal } from "@/ui/modal";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/ui/select";
import { Button } from "@/ui/button";
import { ChevronDown } from "lucide-react";
import { Label } from "@/ui/label";
import { cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import type {
  OrderData,
  CreateOrderPayload,
  UpdateOrderPayload,
} from "@/api/types/orders";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { FormField } from "@/ui/form-field";
import { FileUpload } from "@/ui/file-upload";
import { DatePicker } from "@/ui/date-picker";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { hasPermission } from "@/lib/permissions";
import { responsibleOrganizations } from "@/data";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: CreateOrderPayload | UpdateOrderPayload) => void;
  order?: OrderData | null;
  mode: "create" | "edit";
  isPending: boolean;
}

type LocomotiveOption = {
  id: number;
  label: string;
  value: string;
};

type OrderFormState = {
  train_number: string;
  responsible_department: string;
  damage_amount: string;
  locomotive: string;
  case_description: string;
  date: Date | null;
  type_of_journal: string;
  file: File | null;
  organization: string;
};

const INITIAL_FORM_STATE: OrderFormState = {
  train_number: "",
  responsible_department: "",
  damage_amount: "",
  locomotive: "",
  case_description: "",
  date: null,
  type_of_journal: "mpr",
  file: null,
  organization: "",
};

const journalTypeOptions = [
  { value: "mpr", label: "MPR" },
  { value: "invalid", label: "Yaroqsiz" },
  { value: "defect", label: "Defekt" },
];

const LocomotiveSelect = memo(
  ({
    value,
    onChange,
    options,
    isLoading,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: LocomotiveOption[];
    isLoading: boolean;
  }) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
      "bottom"
    );
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
      if (!searchValue.trim()) return options;
      const q = searchValue.toLowerCase();
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.value.toLowerCase().includes(q)
      );
    }, [options, searchValue]);

    const selectedLabel = options.find((o) => o.value === value)?.label ?? null;

    // Calculate dropdown position when opening (from multi-select)
    useEffect(() => {
      if (open && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 300;
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          setDropdownPosition("top");
        } else {
          setDropdownPosition("bottom");
        }
      }
    }, [open]);

    // Close dropdown when clicking outside (from multi-select)
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
          setSearchValue("");
        }
      };
      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open]);

    const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setOpen(false);
      setSearchValue("");
    };

    return (
      <div className="relative w-full mb-4">
        <Label htmlFor="locomotive">Lokomotiv</Label>
        <div
          ref={triggerRef}
          id="locomotive"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-base",
            "transition-colors outline-none focus:border-blue-500 hover:border-gray-400",
            "md:text-sm",
            isLoading && "pointer-events-none opacity-50 cursor-not-allowed bg-gray-50"
          )}
          onClick={() => !isLoading && setOpen(!open)}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              selectedLabel ? "text-[#0F172B]" : "text-muted-foreground"
            )}
          >
            {selectedLabel ?? "Lokomotivni tanlang"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>

        {open && (
          <div
            ref={dropdownRef}
            className={cn(
              "absolute left-0 right-0 bg-white border border-gray-300 rounded-md z-[999999] max-h-[300px] overflow-hidden",
              "animate-in fade-in-0 zoom-in-95",
              dropdownPosition === "top"
                ? "bottom-full mb-1 slide-in-from-bottom-2"
                : "top-full mt-1 slide-in-from-top-2"
            )}
            style={{ zIndex: 999999 }}
          >
            {isLoading ? (
              <div className="py-3 px-3 text-sm text-muted-foreground">
                Yuklanmoqda...
              </div>
            ) : options.length === 0 ? (
              <div className="py-3 px-3 text-sm text-muted-foreground">
                Lokomotiv topilmadi
              </div>
            ) : (
              <>
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredOptions.length === 0 ? (
                    <div className="py-3 text-center text-sm text-muted-foreground">
                      Natija topilmadi
                    </div>
                  ) : (
                    <div className="py-0.5">
                      {filteredOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 cursor-pointer transition-colors bg-white rounded-sm",
                            option.value === value && "bg-blue-50 text-blue-700"
                          )}
                        >
                          <span className="truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);
LocomotiveSelect.displayName = "LocomotiveSelect";

export function OrderModal({
  isOpen,
  onClose,
  onSave,
  order,
  mode,
  isPending,
}: OrderModalProps) {
  const [formData, setFormData] = useState<OrderFormState>(() => ({
    ...INITIAL_FORM_STATE,
  }));

  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives(isOpen);

  // Check if user has choose_organization permission
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const canChooseOrganization = hasPermission(user, "choose_organization");

  // Fetch organizations if user has permission
  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const locomotiveOptions = useMemo<LocomotiveOption[]>(() => {
    if (!locomotivesData) return [];
    return locomotivesData?.results.map((locomotive) => ({
      id: locomotive.id,
      label: `${locomotive.name} (${locomotive.model_name})`,
      value: locomotive.id.toString(),
    }));
  }, [locomotivesData]);

  const organizationOptions = useMemo(() => {
    if (!organizationsData || !Array.isArray(organizationsData)) return [];
    return organizationsData.map((org) => ({
      value: org.id.toString(),
      label: org.name || `Tashkilot ${org.id}`,
    }));
  }, [organizationsData]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && order) {
      setFormData({
        train_number: order.train_number ?? "",
        responsible_department: order.responsible_department ?? "",
        damage_amount: order.damage_amount ?? "",
        locomotive: order.locomotive ? String(order.locomotive) : "",
        case_description: order.case_description ?? "",
        date: order.date ? new Date(order.date) : null,
        type_of_journal: order.type_of_journal ?? "mpr",
        file: null,
        organization: "",
      });
    } else {
      setFormData(() => ({ ...INITIAL_FORM_STATE, date: new Date() }));
    }
  }, [isOpen, mode, order]);

  const handleTrainNumberChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.train_number === value) return prev;
      return { ...prev, train_number: value };
    });
  }, []);

  const handleDateChange = (value: Date | undefined) => {
    setFormData((prev) => {
      return { ...prev, date: value ?? null };
    });
  };

  const handleLocomotiveChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.locomotive === value) return prev;
      return { ...prev, locomotive: value };
    });
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.responsible_department === value) return prev;
      return { ...prev, responsible_department: value };
    });
  }, []);

  const handleDamageChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.damage_amount === value) return prev;
      return { ...prev, damage_amount: value };
    });
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.case_description === value) return prev;
      return { ...prev, case_description: value };
    });
  }, []);

  const handleJournalTypeChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.type_of_journal === value) return prev;
      return { ...prev, type_of_journal: value };
    });
  }, []);

  const handleFileChange = useCallback((files: File[]) => {
    const file = files[0] ?? null;
    setFormData((prev) => ({ ...prev, file }));
  }, []);

  const handleOrganizationChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.organization === value) return prev;
      return { ...prev, organization: value };
    });
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!formData.locomotive) return;

      const dateISO = formData.date
        ? formData.date.toISOString()
        : new Date().toISOString();

      const payload = {
        train_number: formData.train_number.trim(),
        responsible_department: formData.responsible_department.trim(),
        damage_amount: formData.damage_amount.trim(),
        locomotive: Number(formData.locomotive),
        case_description: formData.case_description.trim(),
        date: dateISO,
        type_of_journal: formData.type_of_journal,
        confirm: mode === "create" ? false : undefined,
        ...(formData.file ? { file: formData.file } : {}),
        ...(canChooseOrganization && formData.organization
          ? { organization: Number(formData.organization) }
          : {}),
      };

      onSave(payload);
    },
    [formData, onSave]
  );

  const handleClose = useCallback(() => {
    setFormData(() => ({ ...INITIAL_FORM_STATE }));
    onClose();
  }, [onClose]);

  const title =
    mode === "create" ? "Buyruq MPR yaratish" : "Buyruq MPR ni tahrirlash";
  const submitText = mode === "create" ? "Yaratish" : "O'zgarishlarni saqlash";
  const actionText =
    mode === "create" ? "Yaratilmoqda..." : "O'zgartirilmoqda...";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <Card className="border-none p-0 mt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_of_journal">Jurnal turi</Label>
              <Select
                value={formData.type_of_journal}
                onValueChange={handleJournalTypeChange}
              >
                <SelectTrigger id="type_of_journal">
                  <SelectValue placeholder="Jurnal turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {journalTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              id="train_number"
              label="Poyezd raqami"
              value={formData.train_number}
              onChange={handleTrainNumberChange}
              placeholder="Poyezd raqamini kiriting"
              required
            />

            <DatePicker
              label="Sana"
              value={formData.date ?? new Date()}
              onValueChange={handleDateChange}
              placeholder="DD/MM/YYYY"
            />

            {canChooseOrganization && (
              <div>
                <Label htmlFor="organization">Tashkilot</Label>
                <Select
                  value={formData.organization}
                  onValueChange={handleOrganizationChange}
                  disabled={isLoadingOrganizations}
                >
                  <SelectTrigger id="organization">
                    <SelectValue placeholder="Tashkilotni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingOrganizations ? (
                      <SelectItem value="loading" disabled>
                        Yuklanmoqda...
                      </SelectItem>
                    ) : organizationOptions.length ? (
                      organizationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>
                        Tashkilot topilmadi
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <LocomotiveSelect
              value={formData.locomotive}
              onChange={handleLocomotiveChange}
              options={locomotiveOptions}
              isLoading={isLoadingLocomotives}
            />

            <div>
              <Label htmlFor="type_of_journal">Mas'ul tashkilot</Label>
              <Select
                value={formData.responsible_department}
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger id="responsible_organization">
                  <SelectValue placeholder="Mas'ul tashkilotni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {responsibleOrganizations.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              id="damage_amount"
              label="Zarar summasi"
              type="number"
              step="0.01"
              value={formData.damage_amount}
              onChange={handleDamageChange}
              placeholder="Zarar summasini kiriting"
              required
            />
          </div>

          <div className="space-y-2">
            <FileUpload
              label="Biriktirilgan fayl"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              maxFiles={1}
              filesUploaded={formData.file ? [formData.file] : []}
              onFilesChange={handleFileChange}
            />
            {!formData.file && order?.file ? (
              <a
                href={order.file}
                className="text-sm text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {order.file}
              </a>
            ) : null}
          </div>

          <FormField
            id="case_description"
            label="Hodisa tavsifi"
            type="textarea"
            rows={4}
            value={formData.case_description}
            onChange={handleDescriptionChange}
            placeholder="Hodisa tavsifini kiriting"
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
              {isPending ? actionText : submitText}
            </Button>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
