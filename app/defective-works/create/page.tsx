"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/ui/card";
import { Button } from "@/ui/button";
import { FormField } from "@/ui/form-field";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { useSnackbar } from "@/providers/snackbar-provider";
import { authService } from "@/api/services/auth.service";
import type { LoginCredentials } from "@/api/types/auth";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useCreateDefectiveWork } from "@/api/hooks/use-defective-works";
import type { DefectiveWorkCreatePayload } from "@/api/types/defective-works";

export default function PublicDefectiveWorkCreatePage() {
  const [formResetKey, setFormResetKey] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const locomotiveInputRef = useRef<HTMLInputElement | null>(null);
  const { showSuccess, showError } = useSnackbar();

  const { data: locomotives = [], isPending: isLoadingLocomotives } =
    useGetLocomotives(true);
  const { data: organizations = [], isPending: isLoadingOrganizations } =
    useOrganizations();
  const { mutateAsync: createDefectiveWork, isPending } =
    useCreateDefectiveWork();

  const performLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);

    const credentials: LoginCredentials = {
      username: "admin20",
      password: "QO123456",
    };

    try {
      const data = await authService.login(credentials);
      const { access, refresh, ...userData } = data;
      const expiryDate = authService.getTokenExpiry(access);

      authService.storeAuth(
        access,
        refresh,
        userData,
        expiryDate?.toISOString()
      );

      setIsAuthLoading(false);
    } catch (error: any) {
      console.error("Auto login failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Avto-kirishda xatolik yuz berdi.";
      setAuthError(message);
      showError("Tizimga kirishda xatolik yuz berdi", message);
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    void performLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    formRef.current?.reset();
    if (locomotiveInputRef.current) {
      locomotiveInputRef.current.value = "";
    }

    setFormResetKey((prev) => prev + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const locomotive = (formData.get("locomotive") as string | null) ?? "";
    const organization = (formData.get("organization") as string | null) ?? "";
    const issue = (formData.get("issue") as string | null) ?? "";

    if (!locomotive || !organization || !issue.trim()) {
      showError("Iltimos, barcha majburiy maydonlarni to'ldiring.");
      return;
    }

    const payload: DefectiveWorkCreatePayload = {
      locomotive: Number(locomotive),
      organization: Number(organization),
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 py-10 text-[#0F172A]">
        <Card className="border border-[#E2E8F0] bg-white p-6 shadow-xl md:p-8">
          <p className="text-center text-sm text-[#475569]">
            Tizimga avtomatik kirilmoqda...
          </p>
        </Card>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 py-10 text-[#0F172A]">
        <Card className="border border-red-200 bg-white p-6 shadow-xl md:p-8 space-y-4">
          <h1 className="text-lg font-semibold text-red-700">
            Tizimga kirishda xatolik yuz berdi
          </h1>
          <p className="text-sm text-[#475569] break-words">{authError}</p>
          <div className="flex justify-end">
            <Button onClick={performLogin}>Qayta urinib ko&apos;rish</Button>
          </div>
        </Card>
      </div>
    );
  }

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
                  Tashkilot
                </Label>
                <Select name="organization" disabled={isLoadingOrganizations}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Tashkilotni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.length ? (
                      organizations.map((organization) => (
                        <SelectItem
                          key={organization.id}
                          value={organization.id.toString()}
                        >
                          {organization.name_uz || organization.name}
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
