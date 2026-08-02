"use client";

import { usePathname } from "next/navigation";
import { ParticipantShell } from "@/components/layout/participant-shell";
import { AdminShell } from "@/components/layout/admin-shell";

export default function DashboardPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/dashboard/admin");

  if (isAdmin) {
    return <AdminShell>{children}</AdminShell>;
  }

  return <ParticipantShell>{children}</ParticipantShell>;
}
