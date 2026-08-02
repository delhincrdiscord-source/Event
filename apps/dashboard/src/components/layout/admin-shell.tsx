"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { useMediaQuery, useHotkey } from "@/lib/hooks";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { CommandPalette } from "@/components/layout/command-palette";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isMobile = useMediaQuery("(max-width: 1024px)");

  useHotkey("k", () => setCommandPaletteOpen((prev) => !prev), { ctrl: true });

  React.useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-screen">
            <AdminSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : sidebarCollapsed ? 64 : 280,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="min-h-screen"
      >
        <TopNav
          onMobileMenuToggle={() => setMobileOpen(true)}
          onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
        />

        <main className="p-4 lg:p-6">{children}</main>
      </motion.div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
