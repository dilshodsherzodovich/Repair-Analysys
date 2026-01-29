"use client";

import { Modal } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Badge } from "@/ui/badge";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Loader2,
  FileUp,
  SquareArrowOutUpRight,
} from "lucide-react";
import type { DelayEntry } from "@/api/types/delays";
import { useTranslations } from "next-intl";

interface ApproveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entry: DelayEntry | null;
  isPending?: boolean;
}

export function ApproveConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  entry,
  isPending = false,
}: ApproveConfirmationModalProps) {
  const t = useTranslations("ApproveConfirmationModal");
  const tDelays = useTranslations("DelaysPage");
  
  if (!entry) return null;

  const hasReport = !!(entry.report_filename || entry.report);
  const statusText = entry.status 
    ? tDelays("status.label_disruption") 
    : tDelays("status.label_no_disruption");
  const responsibleOrgName =
    entry.responsible_org_name ||
    entry.responsible_org_detail?.name ||
    t("unknown");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
      ariaDescribedBy="approve-confirmation-modal"
    >
      <Card className="border-none p-0">
        {/* Warning Header */}
        <div className="bg-amber-50 border-b-2 border-amber-400 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t("title")}
              </h3>
              <p className="text-sm font-medium text-gray-700">
                {t("warning_text")}
              </p>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="p-6 space-y-4">
          {/* Report Card */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  {t("report_title")}
                </h4>
                <p className="text-xs text-gray-500">{t("report_description")}</p>
              </div>
            </div>
            {hasReport ? (
              <div className="pl-13">
                <a
                  href={entry.report}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  {entry.report_filename || t("view_report")}
                  <SquareArrowOutUpRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="pl-13">
                <span className="text-sm text-red-600 font-medium">
                  <AlertTriangle className="w-4 h-4" /> {t("report_not_uploaded")}
                </span>
              </div>
            )}
          </div>

          {/* Status Card */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  {t("status_title")}
                </h4>
                <p className="text-xs text-gray-500">
                  {t("status_description")}
                </p>
              </div>
            </div>
            <div className="pl-13">
              <Badge
                variant={entry.status ? "destructive" : "success"}
                className="text-sm font-semibold px-3 py-1"
              >
                {statusText}
              </Badge>
            </div>
          </div>

          {/* Responsible Organization Card */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  {t("responsible_org_title")}
                </h4>
                <p className="text-xs text-gray-500">
                  {t("responsible_org_description")}
                </p>
              </div>
            </div>
            <div className="pl-13">
              <p className="text-base font-semibold text-gray-900">
                {responsibleOrgName}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 border-t-2 border-gray-200 p-6">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="min-w-[120px]"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold min-w-[150px] shadow-lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("confirming")}
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {t("confirm")}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </Modal>
  );
}
