"use client";

import { Bell, Menu, PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/ui/button";
import { AccountPopover } from "./account-popover";
import { UserData } from "@/api/types/auth";
import { authService } from "@/api/services/auth.service";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";

interface HeaderProps {
  user: UserData;
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onMobileMenuOpen: () => void;
}

export function Header({
  user,
  isSidebarCollapsed,
  onSidebarToggle,
  onMobileMenuOpen,
}: HeaderProps) {
  const t = useTranslations("Sidebar");

  return (
    <header className="h-16 bg-[#ffffff] border-b border-[#e5e7eb] px-4 md:px-6 flex items-center justify-between">
      <div className="flex-1 flex items-center gap-3">
        {/* Mobile: open drawer */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-[#6b7280] hover:text-[#374151] shrink-0"
          onClick={onMobileMenuOpen}
          title={t("sidebar_expand")}
          aria-label={t("sidebar_expand")}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop: collapse/expand */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex text-[#6b7280] hover:text-[#374151] shrink-0"
          onClick={onSidebarToggle}
          title={
            isSidebarCollapsed ? t("sidebar_expand") : t("sidebar_collapse")
          }
          aria-label={
            isSidebarCollapsed ? t("sidebar_expand") : t("sidebar_collapse")
          }
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>

        <LanguageSwitcher />
      </div>
      <div className="flex items-center space-x-4">
        <AccountPopover user={user!} onLogout={authService.logout} />
      </div>
    </header>
  );
}
