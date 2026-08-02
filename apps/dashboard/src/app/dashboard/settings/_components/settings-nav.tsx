"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsLinks = [
  { label: "Profile", href: "/dashboard/settings/profile", icon: User },
  { label: "Security", href: "/dashboard/settings/security", icon: Shield },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-1 lg:w-48 lg:flex-col">
      {settingsLinks.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
