"use client";
import type React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { authService } from "@/api/services/auth.service";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const user = authService.getUser();

  return (
    <div className="h-screen grid grid-cols-[256px_1fr] grid-rows-[1fr] bg-background overflow-hidden">
      <Sidebar />

      <div className="grid grid-rows-[auto_1fr] overflow-hidden">
        <Header user={user!} />
        <main className="overflow-y-auto overflow-x-hidden p-4 bg-background-secondary">
          {children}
        </main>
      </div>
    </div>
  );
}
