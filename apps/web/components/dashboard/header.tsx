"use client";

import { signOut } from "@/lib/auth-client";
import type { User as DbUser } from "@invyte/db";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DashboardHeaderProps {
  user: DbUser;
  tenantSlug: string;
  tenantName: string;
  onMobileMenuToggle?: () => void;
}

export function DashboardHeader({ user, tenantName, onMobileMenuToggle }: DashboardHeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="md:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        {/* Workspace name — desktop only */}
        <span className="hidden md:block text-sm font-medium text-muted-foreground truncate">
          {tenantName}
        </span>
        {/* Logo — mobile only */}
        <span className="md:hidden font-serif text-base font-bold tracking-tight">Invyte</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center">
            <User className="h-4 w-4 text-brand-700" />
          </div>
          <span className="hidden sm:block max-w-[120px] truncate">{user.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1.5 w-48 rounded-lg border bg-card shadow-md py-1">
              <div className="px-3 py-2 border-b">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
