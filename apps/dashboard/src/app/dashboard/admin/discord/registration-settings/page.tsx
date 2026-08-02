"use client";

import { useState, useEffect } from "react";
import { getRegistrationSettings, updateRegistrationSettings, getDiscordChannels, getDiscordRoles } from "../_actions/discord";

export default function RegistrationSettingsPage() {
  const [channelId, setChannelId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [channels, setChannels] = useState<Array<{ id: string; channelId: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; roleId: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, channelsRes, rolesRes] = await Promise.all([
          getRegistrationSettings(),
          getDiscordChannels(),
          getDiscordRoles(),
        ]);

        if (settingsRes.success && settingsRes.data) {
          const data = settingsRes.data as { registrationsChannelId: string | null; registeredRoleId: string | null };
          setChannelId(data.registrationsChannelId ?? "");
          setRoleId(data.registeredRoleId ?? "");
        }

        if (channelsRes.success && Array.isArray(channelsRes.data)) {
          setChannels(channelsRes.data as Array<{ id: string; channelId: string; name: string }>);
        }

        if (rolesRes.success && Array.isArray(rolesRes.data)) {
          setRoles(rolesRes.data as Array<{ id: string; roleId: string; name: string }>);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load settings" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateRegistrationSettings({
        registrationsChannelId: channelId,
        registeredRoleId: roleId,
      });
      if (result.success) {
        setMessage({ type: "success", text: "Settings saved successfully" });
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to save settings" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Registration Discord Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Registration Discord Settings</h1>
      <p className="text-muted-foreground mb-6">
        Configure which Discord channel receives registration notifications and which role is assigned on approval.
      </p>

      {message && (
        <div
          className={`p-3 rounded-md mb-4 ${
            message.type === "success" ?"bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200" :"bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Registrations Channel
          </label>
          <p className="text-sm text-muted-foreground mb-2">
            The channel where new registration notifications will be posted with approve/reject buttons.
          </p>
          <select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-background"
          >
            <option value="">Select a channel...</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.channelId}>
                #{ch.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Or enter a channel ID manually:
          </p>
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="1234567890123456789"
            className="w-full border rounded-md px-3 py-2 bg-background mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Registered Role
          </label>
          <p className="text-sm text-muted-foreground mb-2">
            The role assigned to users when their registration is approved.
          </p>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-background"
          >
            <option value="">Select a role...</option>
            {roles.map((role) => (
              <option key={role.id} value={role.roleId}>
                {role.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Or enter a role ID manually:
          </p>
          <input
            type="text"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            placeholder="1234567890123456789"
            className="w-full border rounded-md px-3 py-2 bg-background mt-1"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
