"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { authService } from "@/api/services/auth.service";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/ui/sheet";
import { useTranslations } from "next-intl";

interface MainLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_WIDTH_EXPANDED = 280;
const SIDEBAR_WIDTH_COLLAPSED = 72;

export function MainLayout({ children }: MainLayoutProps) {
  const user = authService.getUser();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("Sidebar");

  // Close the mobile drawer whenever the user navigates
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  /**
   * The shell is `h-screen` and `<main>` below owns the scrolling, but that
   * only constrains this tree — the document itself is still free to grow past
   * the viewport, and anything that pushes it over produces a second scrollbar
   * beside `<main>`'s. Pin the document to the viewport while the shell is
   * mounted so there is exactly one scroll container.
   *
   * Scoped to this layout rather than set in CSS, so pages that render outside
   * the shell (login, the public defect form) keep normal document scrolling.
   */
  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;
    const previous = {
      rootOverflow: root.style.overflow,
      rootHeight: root.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
    };

    // Both elements: `height: 100%` on body resolves against html, so html
    // has to be sized too or the rule collapses to auto.
    root.style.overflow = "hidden";
    root.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.height = "100%";

    return () => {
      root.style.overflow = previous.rootOverflow;
      root.style.height = previous.rootHeight;
      body.style.overflow = previous.bodyOverflow;
      body.style.height = previous.bodyHeight;
    };
  }, []);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop sidebar — animated collapse/expand */}
      <motion.aside
        animate={{
          width: isSidebarCollapsed
            ? SIDEBAR_WIDTH_COLLAPSED
            : SIDEBAR_WIDTH_EXPANDED,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:block flex-shrink-0 overflow-hidden border-r border-sidebar-border bg-white"
      >
        <Sidebar isCollapsed={isSidebarCollapsed} />
      </motion.aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-[280px] sm:max-w-[280px] bg-white md:hidden"
        >
          <SheetTitle className="sr-only">{t("brand_title")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("brand_subtitle")}
          </SheetDescription>
          <Sidebar isCollapsed={false} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user!}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed((prev) => !prev)}
          onMobileMenuOpen={() => setIsMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 bg-background-secondary">
          {children}
        </main>
      </div>
    </div>
  );
}
