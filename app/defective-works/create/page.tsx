"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
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
import { XIcon, ChevronsUpDown, Search } from "lucide-react";
import { DatePicker } from "@/ui/date-picker";
import { cn } from "@/lib/utils";

interface IssueWithDate {
  text: string;
  date: Date | undefined;
}

/** Single-select with search, same pattern as multi-select */
function SearchableLocomotiveSelect({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  loading,
  emptyMessage,
}: {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">("bottom");
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchValue.toLowerCase())
  );

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
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <div className="relative w-full">
      <div
        ref={triggerRef}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-base cursor-pointer",
          "hover:border-gray-400 focus-within:ring-2 focus-within:ring-[#2354bf]/20 focus-within:border-[#2354bf]",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&>span]:line-clamp-1",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && !loading && setOpen(!open)}
      >
        <span
          className={cn(
            "truncate flex-1 min-w-0 text-left text-sm",
            !selectedOption ? "text-[#90A1B9]" : "text-[#0F172B]"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#64748B]" />
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute left-0 right-0 z-[999999] max-h-[300px] overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg",
            "animate-in fade-in-0 zoom-in-95 duration-100",
            dropdownPosition === "top"
              ? "bottom-full mb-1 slide-in-from-bottom-2"
              : "top-full mt-1 slide-in-from-top-2"
          )}
          style={{ zIndex: 999999 }}
        >
          <div className="p-2 border-b border-[#E2E8F0]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full border border-[#E2E8F0] rounded-md py-2 pl-8 pr-3 text-sm focus:border-[#2354bf] focus:outline-none focus:ring-2 focus:ring-[#2354bf]/20"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto py-0.5">
            {loading ? (
              <div className="p-4 text-center text-sm text-[#64748B]">Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-sm text-[#64748B]">
                {emptyMessage ?? "No items found."}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[#F1F5F9]",
                    opt.value === value && "bg-[#EFF6FF] font-medium text-[#1d4ed8]"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicDefectiveWorkCreatePage() {
  const t = useTranslations("DefectiveWorksCreatePage");
  const searchParams = useSearchParams();
  const organizationFromUrl = searchParams.get("organization") ?? null;

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
  const [selectedLocomotive, setSelectedLocomotive] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const locomotiveInputRef = useRef<HTMLInputElement | null>(null);
  const { showSuccess, showError } = useSnackbar();

  // Perform login on mount
  useEffect(() => {
    const performLogin = async () => {
      setIsAuthLoading(true);
      setAuthError(null);

      const credentials: LoginCredentials = {
        username: "admin20",
        password: "QO123456",
      };

      try {
        const loginData = await authService.login(credentials);
        // Store token in state only (not in localStorage)
        setTemporaryToken(loginData.access);
        setIsAuthLoading(false);
      } catch (error: any) {
        console.error("Auto login failed:", error);
        const data = error?.response?.data;
        let message: string;
        if (typeof data?.detail === "string") {
          message = data.detail;
        } else if (typeof data?.message === "string") {
          message = data.message;
        } else if (
          data?.message &&
          typeof data.message === "object" &&
          data.message !== null &&
          "detail" in data.message
        ) {
          message = String((data.message as { detail: unknown }).detail);
        } else if (typeof error?.message === "string") {
          message = error.message;
        } else {
          message = t("errors.auth");
        }
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
    setSelectedLocomotive("");
    if (!organizationFromUrl) setSelectedOrganization("");
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
    const organization =
      organizationFromUrl ??
      (formData.get("organization") as string | null) ??
      "";
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
            {/* Hidden inputs for form submission */}
            <input type="hidden" name="locomotive" value={selectedLocomotive} />
            <input
              type="hidden"
              name="organization"
              value={organizationFromUrl ?? selectedOrganization}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block text-sm font-medium text-[#1E293B]">
                  {t("locomotive")}
                </Label>
                <SearchableLocomotiveSelect
                  options={
                    locomotives.length
                      ? locomotives.map((loc) => ({
                          value: loc.id.toString(),
                          label: `${loc.name} (${loc.model_name})`,
                        }))
                      : []
                  }
                  value={selectedLocomotive}
                  onValueChange={setSelectedLocomotive}
                  placeholder={t("locomotive_placeholder")}
                  disabled={isLoadingLocomotives}
                  loading={isLoadingLocomotives}
                  emptyMessage={t("locomotive_empty")}
                />
              </div>

              {organizationFromUrl ? (
                <div>
                  <Label className="mb-2 block text-sm font-medium text-[#1E293B]">
                    {t("organization")}
                  </Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-gray-200 bg-[#F8FAFC] px-4 py-2 text-sm text-[#475569]">
                    {organizations.find(
                      (o) => o.id.toString() === organizationFromUrl
                    )?.name ?? organizationFromUrl}
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="mb-2 block text-sm font-medium text-[#1E293B]">
                    {t("organization")}
                  </Label>
                  <Select
                    name="organization"
                    value={selectedOrganization}
                    onValueChange={setSelectedOrganization}
                    disabled={isLoadingOrganizations}
                  >
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
              )}

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
