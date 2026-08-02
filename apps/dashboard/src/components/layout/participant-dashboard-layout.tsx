import type { ReactNode } from "react";
import { ParticipantShell } from "@/components/layout/participant-shell";

interface ParticipantDashboardLayoutProps {
  children: ReactNode;
}

export function ParticipantDashboardLayout({ children }: ParticipantDashboardLayoutProps) {
  return <ParticipantShell>{children}</ParticipantShell>;
}
