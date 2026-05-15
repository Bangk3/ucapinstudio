"use client";

import { BarChart2, LayoutDashboard, ScrollText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Tamu and RSVP are managed per-invitation at:
//   /[tenant]/dashboard/invitations/[id]/guests
//   /[tenant]/dashboard/invitations/[id]/wishes
// They are accessed from the invitation list, not from top-level sidebar links.
const NAV_ITEMS = [
  { label: "Dasbor", href: "dashboard", icon: LayoutDashboard, exact: true },
  { label: "Undangan", href: "dashboard/invitations", icon: ScrollText },
  { label: "Analitik", href: "dashboard/analytics", icon: BarChart2 },
  { label: "Pengaturan", href: "dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  tenantSlug: string;
}

export function DashboardSidebar({ tenantSlug }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r bg-card flex flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-serif text-lg font-bold tracking-tight">Invyte</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const href = `/${tenantSlug}/${item.href}`;
          const active = item.exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <p className="px-3 text-xs text-muted-foreground truncate">{tenantSlug}</p>
      </div>
    </aside>
  );
}
