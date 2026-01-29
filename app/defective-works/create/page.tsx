"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
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
import { defectiveWorksService } from "@/api/services/defective-works.service";
import type { DefectiveWorkCreatePayload } from "@/api/types/defective-works";
import { XIcon } from "lucide-react";
import { DatePicker } from "@/ui/date-picker";

interface IssueWithDate {
  text: string;
  date: Date | undefined;
}

export default function PublicDefectiveWorkCreatePage() {
  const t = useTranslations("DefectiveWorksCreatePage");
  const [formResetKey, setFormResetKey] = useState(0);
  const [issues, setIssues] = useState<IssueWithDate[]>([]);
  const [currentIssueDate, setCurrentIssueDate] = useState<Date | undefined>(
    undefined
  );
  const [isPending, setIsPending] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [temporaryToken, setTemporaryToken] = useState<string | undefined>(
    undefined
  );
  const formRef = useRef<HTMLFormElement | null>(null);
  const locomotiveInputRef = useRef<HTMLInputElement | null>(null);
  const { showSuccess, showError } = useSnackbar();

  // Perform login on mount
  useEffect(() => {
    const performLogin = async () => {
      setIsAuthLoading(true);
      setAuthError(null);

      const credentials: LoginCredentials = {
        username: "repair_employee",
        password: "123",
      };

      try {
        const loginData = await authService.login(credentials);
        // Store token in state only (not in localStorage)
        setTemporaryToken(loginData.access);
        setIsAuthLoading(false);
      } catch (error: any) {
        console.error("Auto login failed:", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("errors.auth");
        setAuthError(message);
        showError(t("errors.login"), message);
        setIsAuthLoading(false);
      }
    };

    void performLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only fetch data when token is available
  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives(!!temporaryToken, temporaryToken);
  const locomotives = locomotivesData?.results ?? [];
  const { data: organizations = [], isPending: isLoadingOrganizations } =
    useOrganizations(temporaryToken);

  const resetForm = () => {
    formRef.current?.reset();
    if (locomotiveInputRef.current) {
      locomotiveInputRef.current.value = "";
    }

    setIssues([]);
    setCurrentIssueDate(undefined);
    if (formRef.current) {
      const issueTextarea = formRef.current.querySelector<HTMLTextAreaElement>(
        'textarea[name="currentIssue"]'
      );
      if (issueTextarea) {
        issueTextarea.value = "";
      }
    }
    setFormResetKey((prev) => prev + 1);
  };

  const handleAddIssue = () => {
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const rawValue = (formData.get("currentIssue") as string | null) ?? "";
    const value = rawValue.trim();
    if (!value) return;

    setIssues((prev) => [
      ...prev,
      { text: value, date: currentIssueDate || new Date() },
    ]);

    const issueTextarea = formRef.current.querySelector<HTMLTextAreaElement>(
      'textarea[name="currentIssue"]'
    );
    if (issueTextarea) {
      issueTextarea.value = "";
    }
  };

  const handleRemoveIssue = (index: number) => {
    setIssues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateIssueDate = (index: number, date: Date | undefined) => {
    setIssues((prev) =>
      prev.map((issue, i) => (i === index ? { ...issue, date } : issue))
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const locomotive = (formData.get("locomotive") as string | null) ?? "";
    const organization = (formData.get("organization") as string | null) ?? "";
    const trainDriver = (formData.get("train_driver") as string | null) ?? "";
    const currentIssueFromForm =
      (formData.get("currentIssue") as string | null) ?? "";
    const trimmedCurrent = currentIssueFromForm.trim();

    // Combine existing issues with current issue if it exists
    const allIssues: IssueWithDate[] = trimmedCurrent
      ? [...issues, { text: trimmedCurrent, date: currentIssueDate || new Date() }]
      : [...issues];

    if (
      !locomotive ||
      !organization ||
      !trainDriver.trim() ||
      allIssues.length === 0
    ) {
      showError(t("errors.required"));
      return;
    }

    // Validate that all issues have dates
    const issuesWithoutDates = allIssues.filter((issue) => !issue.date);
    if (issuesWithoutDates.length > 0) {
      showError(
        t("errors.dates"),
        t("errors.dates_count", { count: issuesWithoutDates.length })
      );
      return;
    }

    if (!temporaryToken) {
      showError(t("errors.login"), t("errors.token"));
      return;
    }

    setIsPending(true);
    try {
      // Prepare payloads with individual dates
      const payloads: DefectiveWorkCreatePayload[] = allIssues.map(
        (issue) => ({
          locomotive: Number(locomotive),
          organization_id: Number(organization),
          train_driver: trainDriver.trim(),
          issue: issue.text,
          date: issue.date!.toISOString(),
        })
      );

      // Make bulk create request with token from state (not stored in localStorage)
      await defectiveWorksService.bulkCreateDefectiveWorks(
        payloads,
        temporaryToken
      );

      showSuccess(
        allIssues.length > 1 ? t("success_multi") : t("success_single")
      );
      resetForm();
    } catch (error: any) {
      showError(
        t("errors.submit"),
        error?.response?.data?.message || error?.message
      );
    } finally {
      setIsPending(false);
    }
  };

  // Show loading state while authenticating
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 py-10 text-[#0F172A]">
        <Card className="border border-[#E2E8F0] bg-white p-6 shadow-xl md:p-8">
          <p className="text-center text-sm text-[#475569]">
            {t("loading")}
          </p>
        </Card>
      </div>
    );
  }

  // Show error state if authentication failed
  if (authError || !temporaryToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 py-10 text-[#0F172A]">
        <Card className="border border-red-200 bg-white p-6 shadow-xl md:p-8 space-y-4">
          <h1 className="text-lg font-semibold text-red-700">
            {t("auth_error_title")}
          </h1>
          <p className="text-sm text-[#475569] break-words">
            {authError || t("auth_error_token")}
          </p>
          <div className="flex justify-end">
            <Button onClick={() => window.location.reload()} variant="outline">
              {t("retry")}
            </Button>
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
            {t("title")}
          </h1>
          <p className="text-base text-[#475569] md:text-lg">
            {t("subtitle")}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[#475569]">
            <span>{t("has_account")}</span>
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("login_link")}
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
                  {t("locomotive")}
                </Label>
                <Select name="locomotive" disabled={isLoadingLocomotives}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={t("locomotive_placeholder")} />
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
                        {t("locomotive_empty")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium text-[#1E293B]">
                  {t("organization")}
                </Label>
                <Select name="organization" disabled={isLoadingOrganizations}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={t("organization_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.length ? (
                      organizations.map((organization) => (
                        <SelectItem
                          key={organization.id}
                          value={organization.id.toString()}
                        >
                          {organization.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>
                        {t("organization_empty")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                id="train_driver"
                name="train_driver"
                label={t("train_driver")}
                placeholder={t("train_driver_placeholder")}
                required
              />

              <div>
                <DatePicker
                  label={t("issue_date")}
                  value={currentIssueDate}
                  onValueChange={setCurrentIssueDate}
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>

            <div className="space-y-3">
              <FormField
                id="issue"
                name="currentIssue"
                label={t("issue_label")}
                type="textarea"
                rows={4}
                placeholder={t("issue_placeholder")}
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[#64748B]">
                  {t("add_issue_hint")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddIssue}
                  disabled={isPending}
                  className="border-[#CBD5F5] text-[#1D4ED8] hover:bg-[#EEF2FF] whitespace-nowrap"
                >
                  {t("add_to_list")}
                </Button>
              </div>

              {issues.length > 0 && (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-[#1E293B]">
                      {t("added_issues", { count: issues.length })}
                    </p>
                  </div>

                  {issues.map((issue, index) => (
                    <div
                      key={index}
                      className="rounded-md border-2 border-dashed border-[#CBD5F5]  bg-[#F8FAFF] p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between overflow-y-auto text-xs text-[#475569]">
                       <div className="flex items-center gap-2">
                       <span className="flex-1">
                          {index + 1}. {issue.text}
                        </span>

                        <DatePicker  
                          value={issue.date}
                          onValueChange={(date) =>
                            handleUpdateIssueDate(index, date)
                          }
                          placeholder="DD/MM/YYYY"
                          size="sm"
                        />
                       </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="bg-red-400 w-6 h-6"
                          onClick={() => handleRemoveIssue(index)}
                          disabled={isPending}
                        >
                          <XIcon className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-[#475569]">
                {t("submit_note")}
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#CBD5F5] text-[#1D4ED8] hover:bg-[#EEF2FF]"
                  onClick={resetForm}
                  disabled={isPending}
                >
                  {t("clear")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? t("submitting") : t("submit")}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
