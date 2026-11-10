"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/ui/card";
import { Button } from "@/ui/button";
import { FormField } from "@/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SearchableSelect,
} from "@/ui/select";
import { useSnackbar } from "@/providers/snackbar-provider";
import { authService } from "@/api/services/auth.service";
import type { LoginCredentials } from "@/api/types/auth";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useRevisionRemarkGroups } from "@/api/hooks/use-defective-works";
import { defectiveWorksService } from "@/api/services/defective-works.service";
import type { DefectiveWorkCreatePayload } from "@/api/types/defective-works";
import { XIcon } from "lucide-react";
import { DateTimePicker } from "@/ui/datetime-picker";

import { Field } from "@/ui/field";
interface IssueWithDate {
  text: string;
  date: Date | undefined;
  remark?: number;
  remarkGroup?: number;
  remarkLabel?: string;
}

/** Single-select with search, same pattern as multi-select */
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
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRemark, setSelectedRemark] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const locomotiveInputRef = useRef<HTMLInputElement | null>(null);
  const { showSuccess, showError } = useSnackbar();

  // Perform login on mount
  useEffect(() => {
    const performLogin = async () => {
      setIsAuthLoading(true);
      setAuthError(null);

      const credentials: LoginCredentials = {
        username: "admin01",
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

  // TU-152 defect groups for the picked locomotive (backend resolves the type).
  const { data: remarkGroups, isFetching: isLoadingRemarkGroups } =
    useRevisionRemarkGroups(
      {
        locomotive: selectedLocomotive || undefined,
        only_active: true,
        no_page: true,
      },
      { enabled: !!temporaryToken && !!selectedLocomotive, token: temporaryToken },
    );
  const groups = remarkGroups ?? [];
  const activeGroup = groups.find((g) => String(g.id) === selectedGroup);
  const remarkOptions = activeGroup?.remarks ?? [];

  const resetForm = () => {
    formRef.current?.reset();
    if (locomotiveInputRef.current) {
      locomotiveInputRef.current.value = "";
    }
    setSelectedLocomotive("");
    if (!organizationFromUrl) setSelectedOrganization("");
    setSelectedGroup("");
    setSelectedRemark("");
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

    const remarkName = remarkOptions.find(
      (r) => String(r.id) === selectedRemark,
    )?.name;
    const remarkLabel =
      activeGroup && remarkName
        ? `${activeGroup.name} / ${remarkName}`
        : undefined;

    setIssues((prev) => [
      ...prev,
      {
        text: value,
        date: currentIssueDate || new Date(),
        remark: selectedRemark ? Number(selectedRemark) : undefined,
        remarkGroup: selectedGroup ? Number(selectedGroup) : undefined,
        remarkLabel,
      },
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
      ? [
          ...issues,
          {
            text: trimmedCurrent,
            date: currentIssueDate || new Date(),
            remark: selectedRemark ? Number(selectedRemark) : undefined,
            remarkGroup: selectedGroup ? Number(selectedGroup) : undefined,
          },
        ]
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
      const payloads: DefectiveWorkCreatePayload[] = allIssues.map((issue) => ({
        locomotive: Number(locomotive),
        organization_id: Number(organization),
        train_driver: trainDriver.trim(),
        issue: issue.text,
        date: issue.date!.toISOString(),
        ...(issue.remark ? { remark: issue.remark } : {}),
        ...(issue.remarkGroup ? { remark_group: issue.remarkGroup } : {}),
      }));

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
      <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4 py-10 text-foreground">
        <Card className="border border-border bg-background p-6 shadow-xl md:p-8">
          <p className="text-center text-sm text-foreground-secondary">{t("loading")}</p>
        </Card>
      </div>
    );
  }

  // Show error state if authentication failed
  if (authError || !temporaryToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4 py-10 text-foreground">
        <Card className="border border-destructive/30 bg-background p-6 shadow-xl md:p-8 space-y-4">
          {/* kit-allow: public defect form hero, outside the app layout */}
          <h1 className="text-lg font-semibold text-destructive">
            {t("auth_error_title")}
          </h1>
          <p className="text-sm text-foreground-secondary break-words">
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
    <div className="min-h-screen bg-surface-muted px-4 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Smart Depo
          </p>
          {/* kit-allow: public defect form hero, outside the app layout */}
          <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
          <p className="text-base text-foreground-secondary md:text-lg">{t("subtitle")}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-foreground-secondary">
            <span>{t("has_account")}</span>
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("login_link")}
            </Link>
          </div>
        </header>

        <Card className="border border-border bg-background p-6 shadow-xl md:p-8">
          <form
            key={formResetKey}
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Hidden inputs for form submission */}
            <input type="hidden" name="locomotive" value={selectedLocomotive} />
            <input type="hidden" name="organization" value={organizationFromUrl ?? selectedOrganization} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t("locomotive")}>
                <SearchableSelect
                  searchable
                  options={
                    locomotives.length
                      ? locomotives.map((loc) => ({
                          value: loc.id.toString(),
                          label: `${loc.name} (${loc.model_name})`,
                        }))
                      : []
                  }
                  value={selectedLocomotive}
                  onValueChange={(v) => {
                    setSelectedLocomotive(v);
                    setSelectedGroup("");
                    setSelectedRemark("");
                  }}
                  placeholder={t("locomotive_placeholder")}
                  disabled={isLoadingLocomotives}
                  loading={isLoadingLocomotives}
                  emptyMessage={t("locomotive_empty")}
                />
              </Field>

              {organizationFromUrl ? (
                <Field label={t("organization")}>
                  <div className="flex h-10 w-full items-center rounded-md border border-border bg-surface-muted px-4 py-2 text-sm text-foreground-secondary">
                    {organizations.find(
                      (o) => o.id.toString() === organizationFromUrl
                    )?.name ?? organizationFromUrl}
                  </div>
                </Field>
              ) : (
                <Field label={t("organization")}>
                  <Select
                    name="organization"
                    value={selectedOrganization}
                    onValueChange={setSelectedOrganization}
                    disabled={isLoadingOrganizations}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue
                        placeholder={t("organization_placeholder")}
                      />
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
                </Field>
              )}

              <FormField
                id="train_driver"
                name="train_driver"
                label={t("train_driver")}
                placeholder={t("train_driver_placeholder")}
                required
              />

              <div>
                <DateTimePicker
                  label={t("issue_date")}
                  value={currentIssueDate}
                  onValueChange={setCurrentIssueDate}
                  placeholder="DD/MM/YYYY HH:mm"
                />
              </div>

              {/* TU-152 defect group */}
              <Field label={t("remark_group")}>
                <Select
                  value={selectedGroup}
                  onValueChange={(v) => {
                    setSelectedGroup(v);
                    setSelectedRemark("");
                  }}
                  disabled={!selectedLocomotive || isLoadingRemarkGroups}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue
                      placeholder={
                        !selectedLocomotive
                          ? t("remark_group_pick_locomotive")
                          : isLoadingRemarkGroups
                            ? t("remark_loading")
                            : groups.length === 0
                              ? t("remark_group_empty")
                              : t("remark_group_placeholder")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* TU-152 defect */}
              <Field label={t("remark")}>
                <Select
                  value={selectedRemark}
                  onValueChange={setSelectedRemark}
                  disabled={!selectedGroup || remarkOptions.length === 0}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue
                      placeholder={
                        !selectedGroup
                          ? t("remark_pick_group")
                          : remarkOptions.length === 0
                            ? t("remark_empty")
                            : t("remark_placeholder")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {remarkOptions.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
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
                <p className="text-xs text-muted-foreground">{t("add_issue_hint")}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddIssue}
                  disabled={isPending}
                  className="border-primary/30 text-primary-hover hover:bg-primary-subtle whitespace-nowrap"
                >
                  {t("add_to_list")}
                </Button>
              </div>

              {issues.length > 0 && (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">
                      {t("added_issues", { count: issues.length })}
                    </p>
                  </div>

                  {issues.map((issue, index) => (
                    <div
                      key={index}
                      className="rounded-md border-2 border-dashed border-primary/30  bg-surface-muted p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between overflow-y-auto text-xs text-foreground-secondary">
                        <div className="flex items-center gap-2">
                          <span className="flex-1">
                            {index + 1}. {issue.text}
                            {issue.remarkLabel && (
                              <span className="ml-2 inline-flex items-center rounded bg-primary-subtle px-1.5 py-0.5 text-2xs font-medium text-primary-hover">
                                {issue.remarkLabel}
                              </span>
                            )}
                          </span>

                          <DateTimePicker
                            value={issue.date}
                            onValueChange={(date) =>
                              handleUpdateIssueDate(index, date)
                            }
                            placeholder="DD/MM/YYYY HH:mm"
                            size="sm"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="bg-destructive w-6 h-6"
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
              <p className="text-sm text-foreground-secondary">{t("submit_note")}</p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary/30 text-primary-hover hover:bg-primary-subtle"
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
