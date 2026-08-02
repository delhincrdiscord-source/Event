"use client";


import React, { useState, useEffect } from 'react';
import * as React from "react";
import { motion } from "framer-motion";
import { useMediaQuery, useHotkey } from "@/lib/hooks";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  const isMobile = useMediaQuery("(max-width: 1024px)");

  // Ctrl+K for command palette
  useHotkey("k", () => setCommandPaletteOpen((prev) => !prev), { ctrl: true });

  // Close mobile sidebar on resize
  React.useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

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
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
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
