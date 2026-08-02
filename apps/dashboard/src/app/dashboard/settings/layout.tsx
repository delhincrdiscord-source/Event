import type { Metadata } from "next";
import { SettingsNav } from "./_components/settings-nav";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
