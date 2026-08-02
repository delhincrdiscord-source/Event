"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
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
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  section: string;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = React.useState("");

  const items: CommandItem[] = [
    // Navigation - Personal Dashboard
    { id: "dashboard", label: "My Dashboard", icon: LayoutDashboard, href: "/dashboard", section: "Navigation" },
    { id: "my-registrations", label: "My Registrations", icon: Ticket, href: "/dashboard/my-registrations", section: "Navigation" },
    { id: "leaderboard", label: "Leaderboard", icon: BarChart3, href: "/dashboard/leaderboard", section: "Navigation" },
    { id: "achievements", label: "Achievements", icon: Megaphone, href: "/dashboard/achievements", section: "Navigation" },
    { id: "badges", label: "Badges", icon: Megaphone, href: "/dashboard/badges", section: "Navigation" },
    { id: "rewards", label: "Rewards", icon: Megaphone, href: "/dashboard/rewards", section: "Navigation" },
    { id: "hall-of-fame", label: "Hall of Fame", icon: Megaphone, href: "/dashboard/hall-of-fame", section: "Navigation" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/dashboard/notifications", section: "Navigation" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings", section: "Navigation" },
    // Navigation - Admin Panel
    { id: "admin-festivals", label: "Admin: Festivals", icon: Calendar, href: "/dashboard/admin/festivals", section: "Admin" },
    { id: "admin-events", label: "Admin: Events", icon: CalendarDays, href: "/dashboard/admin/events", section: "Admin" },
    { id: "admin-registrations", label: "Admin: Registrations", icon: Ticket, href: "/dashboard/admin/registrations", section: "Admin" },
    { id: "admin-announcements", label: "Admin: Announcements", icon: Megaphone, href: "/dashboard/admin/announcements", section: "Admin" },
    { id: "admin-gallery", label: "Admin: Gallery", icon: Image, href: "/dashboard/admin/gallery", section: "Admin" },
    { id: "admin-analytics", label: "Admin: Analytics", icon: BarChart3, href: "/dashboard/admin/analytics", section: "Admin" },
    { id: "admin-discord", label: "Admin: Discord", icon: MessageCircle, href: "/dashboard/admin/discord", section: "Admin" },

    // Actions
    {
      id: "theme-toggle",
      label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
      icon: theme === "dark" ? Sun : Moon,
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
      section: "Actions",
    },
    { id: "logout", label: "Log Out", icon: LogOut, action: () => { window.location.href = "/api/auth/signout"; }, section: "Actions" },
  ];

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = [];
      }
      acc[item.section]!.push(item);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onClose]);

  const handleSelect = (item: CommandItem) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[--z-command] bg-black/50"
            onClick={onClose}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-[--z-command] w-full max-w-lg -translate-x-1/2 px-4"
          >
            <Command className="overflow-hidden rounded-xl border bg-background shadow-2xl">
              <div className="flex items-center border-b px-4">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="flex h-12 w-full rounded-md bg-transparent py-3 pl-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                {Object.entries(groupedItems).map(([section, items]) => (
                  <Command.Group key={section} heading={section} className="px-2 py-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Command.Item
                          key={item.id}
                          value={item.label}
                          onSelect={() => handleSelect(item)}
                          className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{item.label}</span>
                          {item.href && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {item.href}
                            </span>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </Command.List>

              <div className="flex items-center justify-between border-t px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    ↑↓
                  </kbd>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    ↵
                  </kbd>
                  <span>to select</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    esc
                  </kbd>
                  <span>to close</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
