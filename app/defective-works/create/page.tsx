"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/ui/card";
import { Button } from "@/ui/button";
import { FormField } from "@/ui/form-field";
import { DatePicker } from "@/ui/date-picker";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { useSnackbar } from "@/providers/snackbar-provider";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useCreateDefectiveWork } from "@/api/hooks/use-defective-works";
import type { DefectiveWorkCreatePayload } from "@/api/types/defective-works";

export default function PublicDefectiveWorkCreatePage() {
  const [formResetKey, setFormResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement | null>(null);
  const locomotiveInputRef = useRef<HTMLInputElement | null>(null);
  const inspectionInputRef = useRef<HTMLInputElement | null>(null);
  const { showSuccess, showError } = useSnackbar();

  const { data: locomotives = [], isPending: isLoadingLocomotives } =
    useGetLocomotives(true);
  const { data: inspectionTypes = [], isPending: isLoadingInspectionTypes } =
    useGetInspectionTypes(true);
  const { mutateAsync: createDefectiveWork, isPending } =
    useCreateDefectiveWork();

  const resetForm = () => {
    formRef.current?.reset();
    if (locomotiveInputRef.current) {
      locomotiveInputRef.current.value = "";
    }
    if (inspectionInputRef.current) {
      inspectionInputRef.current.value = "";
    }

    setFormResetKey((prev) => prev + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const locomotive = (formData.get("locomotive") as string | null) ?? "";
    const inspectionType =
      (formData.get("inspection_type") as string | null) ?? "";
    const issue = (formData.get("issue") as string | null) ?? "";

    if (!locomotive || !inspectionType || !issue.trim()) {
      showError("Iltimos, barcha majburiy maydonlarni to'ldiring.");
      return;
    }

    const payload: DefectiveWorkCreatePayload = {
      locomotive: Number(locomotive),
      inspection_type: Number(inspectionType),
      issue: issue.trim(),
      date: new Date().toISOString(),
    };

    try {
      await createDefectiveWork(payload);
      showSuccess(
        "Nosoz ish muvaffaqiyatli yuborildi. Mutaxassislar tez orada bog'lanadi."
      );
      resetForm();
    } catch (error: any) {
      showError(
        "Nosoz ishni yuborishda xatolik yuz berdi",
        error?.response?.data?.message || error?.message
      );
    }
  };

  const handleSelectChange =
    (ref: React.RefObject<HTMLInputElement | null>) => (value: string) => {
      if (ref.current) {
        ref.current.value = value;
      }
    };

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-4 py-10 text-[#0F172A]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7C8DB5]">
            Smart Depo
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            Nosoz ish haqida xabar berish
          </h1>
          <p className="text-base text-[#475569] md:text-lg">
            Formani to'ldiring va lokomotivdagi nosozlikni tizimga yuboring.
            Ushbu sahifa login talab qilmaydi.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[#475569]">
            <span>Hisobingiz bormi?</span>
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Tizimga kiring
            </Link>
          </div>
        </header>

        <Card className="border border-[#E2E8F0] bg-white p-6 shadow-xl md:p-8">
          <form
            key={formResetKey}
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block text-sm font-medium text-[#1E293B]">
                  Lokomotiv
                </Label>
                <Select name="locomotive" disabled={isLoadingLocomotives}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Lokomotivni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {locomotives.length ? (
                      locomotives.map((locomotive) => (
                        <SelectItem
                          key={locomotive.id}
                          value={locomotive.id.toString()}
                        >
                          {`${locomotive.name} (${locomotive.model_name})`}
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

              <div>
                <Label className="mb-2 block text-sm font-medium text-[#1E293B]">
                  Texnik ko'rik turi
                </Label>
                <Select
                  name="inspection_type"
                  disabled={isLoadingInspectionTypes}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Texnik ko'rik turini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectionTypes.length ? (
                      inspectionTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
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

              <FormField
                id="train_driver"
                name="train_driver"
                label="Mashinist"
                placeholder="Ism va familiya"
                required
              />

              {/* <FormField
                id="table_number"
                name="table_number"
                label="Tabel raqam"
                placeholder="Masalan, 12345"
                required
              /> */}

              {/* <FormField
                id="code"
                name="code"
                label="Nosozlik kodi"
                placeholder="Kod kiriting"
                required
              /> */}

              {/* <div>
                <DatePicker
                  label="Nosozlik aniqlangan sana"
                  value={selectedDate}
                  onValueChange={setSelectedDate}
                  placeholder="DD/MM/YYYY"
                />
              </div> */}
            </div>

            <FormField
              id="issue"
              name="issue"
              label="Nosozlik tavsifi"
              type="textarea"
              rows={4}
              placeholder="Nosozlik haqida batafsil ma'lumot kiriting"
              required
            />

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-[#475569]">
                Yuborilgan ma'lumotlar nazorat markaziga bevosita yetkaziladi.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#CBD5F5] text-[#1D4ED8] hover:bg-[#EEF2FF]"
                  onClick={resetForm}
                  disabled={isPending}
                >
                  Tozalash
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Yuborilmoqda..." : "Nosozlikni yuborish"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
