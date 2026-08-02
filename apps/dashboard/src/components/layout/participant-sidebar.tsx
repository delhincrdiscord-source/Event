"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Gamepad2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  emoji: string;
  badge?: string | number;
}

const participantNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", emoji: "🏠" },
  { label: "Events", href: "/dashboard/events", emoji: "📅" },
  { label: "My Registrations", href: "/dashboard/my-registrations", emoji: "📝" },
  { label: "Leaderboard", href: "/dashboard/leaderboard", emoji: "🏆" },
  { label: "Achievements", href: "/dashboard/achievements", emoji: "🏅" },
  { label: "Badges", href: "/dashboard/badges", emoji: "🎖️" },
  { label: "Rewards", href: "/dashboard/rewards", emoji: "🎁" },
  { label: "Hall of Fame", href: "/dashboard/hall-of-fame", emoji: "👑" },
  { label: "Notifications", href: "/dashboard/notifications", emoji: "🔔" },
  { label: "Profile", href: "/dashboard/settings/profile", emoji: "👤" },
];

const bottomNavItems: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", emoji: "⚙️" },
];

interface ParticipantSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  userRole?: string;
}

export function ParticipantSidebar({ collapsed = false, onToggle, userRole }: ParticipantSidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "ADMIN" || userRole === "ORGANIZER";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-[--z-sidebar] flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
    >
      {/* Logo */}
      <div className="flex h-[--spacing-topnav] items-center gap-3 border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Gamepad2 className="h-4 w-4 text-primary-foreground" />
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
                Gameverse
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {participantNavItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Admin Panel Link */}
        {isAdmin && (
          <>
            <Separator className="my-4" />
            <div className="space-y-1">
              <Link
                href="/dashboard/admin"
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/dashboard/admin")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" :"text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Shield className={cn("h-4 w-4 shrink-0", pathname.startsWith("/dashboard/admin") && "text-primary")} />
                {!collapsed && <span>Admin Panel</span>}
              </Link>
            </div>
          </>
        )}
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
      <span className={cn("text-lg leading-none shrink-0", active && "text-primary")}>
        {item.emoji}
      </span>
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

export { participantNavItems };
export type { NavItem };
