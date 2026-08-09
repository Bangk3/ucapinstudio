"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/topup-requests", label: "Top-Up" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/transactions", label: "Transaksi" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/ai-config", label: "AI" },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r bg-card p-4 space-y-1">
      <div className="mb-4">
        <p className="font-serif text-lg font-bold">Admin Panel</p>
        <p className="text-xs text-muted-foreground capitalize">{role}</p>
      </div>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === link.href
              ? "bg-primary/10 font-medium text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
