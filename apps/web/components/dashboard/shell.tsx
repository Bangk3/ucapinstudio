"use client";

import type { User as DbUser } from "@invyte/db";
import { useState } from "react";
import { DashboardHeader } from "./header";
import { DashboardSidebar } from "./sidebar";

interface Props {
  children: React.ReactNode;
  user: DbUser;
  tenantSlug: string;
  tenantName: string;
}

export function DashboardShell({ children, user, tenantSlug, tenantName }: Props) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar
        tenantSlug={tenantSlug}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader
          user={user}
          tenantSlug={tenantSlug}
          tenantName={tenantName}
          onMobileMenuToggle={() => setMobileSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
