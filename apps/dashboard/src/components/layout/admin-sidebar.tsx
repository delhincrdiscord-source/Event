"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Ticket,
  Megaphone,
  Image,
  Bell,
  BarChart3,
  MessageCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  FolderOpen,
  FormInput,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const adminNavItems: NavItem[] = [
  { label: "Admin Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Festivals", href: "/dashboard/admin/festivals", icon: Calendar },
  { label: "Events", href: "/dashboard/admin/events", icon: CalendarDays },
  { label: "Registrations", href: "/dashboard/admin/registrations", icon: Ticket },
  { label: "Announcements", href: "/dashboard/admin/announcements", icon: Megaphone },
  { label: "Categories", href: "/dashboard/admin/categories", icon: FolderOpen },
  { label: "Gallery", href: "/dashboard/admin/gallery", icon: Image },
  { label: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
  { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  { label: "Discord", href: "/dashboard/admin/discord", icon: MessageCircle },
  { label: "Form Builder", href: "/dashboard/admin/form-builder", icon: FormInput },
];

const bottomNavItems: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-[--z-sidebar] flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
    >
      {/* Logo */}
      <div className="flex h-[--spacing-topnav] items-center gap-3 border-b border-sidebar-border px-4">
        <Link href="/dashboard/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap text-sm font-semibold text-sidebar-foreground"
              >
                Admin Panel
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Back to Dashboard */}
      <div className="px-3 pt-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Gamepad2 className="h-4 w-4" />
          {!collapsed && <span>Back to Dashboard</span>}
        </Link>
      </div>

      <Separator className="my-2" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          {adminNavItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      <Separator />

      {/* Bottom Navigation */}
      <div className="px-3 py-4">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Collapse Toggle */}
      <div className="flex items-center justify-center py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
        </Button>
      </div>
    </motion.aside>
  );
}

interface SidebarItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}

function SidebarItem({ item, active, collapsed }: SidebarItemProps) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
          transition={{ duration: 0.2 }}
        />
      )}
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && item.badge && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground"
        >
          {item.badge}
        </motion.span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
