"use client";

import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { authService } from "@/api/services/auth.service";

interface MainLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_WIDTH_EXPANDED = 280;
const SIDEBAR_WIDTH_COLLAPSED = 72;

export function MainLayout({ children }: MainLayoutProps) {
  const user = authService.getUser();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <motion.aside
        animate={{ width: isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="flex-shrink-0 overflow-hidden border-r border-sidebar-border bg-white"
      >
        <Sidebar isCollapsed={isSidebarCollapsed} />
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user!}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-background-secondary">
          {children}
        </main>
      </div>
    </div>
  );
}
