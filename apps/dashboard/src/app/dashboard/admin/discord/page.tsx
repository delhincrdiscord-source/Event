"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Settings,
  Bot,
  Server,
  Hash,
  Shield,
  Webhook,
  Zap,
  ExternalLink,
  Save,
  Loader2,
  RefreshCw,
  Activity,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  TestTube,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Label } from "@gameverse/ui/label";
import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Separator } from "@gameverse/ui/separator";
import { Skeleton } from "@gameverse/ui/skeleton";
import { Switch } from "@gameverse/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";

import {
  getDiscordConfig,
  updateDiscordConfigAction,
  createDiscordConfig,
  getDiscordStats,
  getBotStatus,
  testDiscordWebhook,
} from "./_actions/discord";
import type {
  DiscordConfig,
  DiscordIntegrationStats,
  BotStatusInfo,
} from "@gameverse/types";
import {
  BOT_STATUS_LABELS,
  BOT_STATUS_COLORS,
  DISCORD_INVITE_URL,
} from "@gameverse/types";

export default function DiscordSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<DiscordConfig | null>(null);
  const [stats, setStats] = useState<DiscordIntegrationStats | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatusInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    botToken: "",
    guildId: "",
    clientId: "",
    clientSecret: "",
    publicKey: "",
  });

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDiscordConfig();
      if (result.success && result.data) {
        const data = result.data as DiscordConfig;
        setConfig(data);
        setFormData({
          botToken: "",
          guildId: data.guildId,
          clientId: data.clientId,
          clientSecret: "",
          publicKey: "",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const result = await getDiscordStats();
    if (result.success && result.data) {
      setStats(result.data as DiscordIntegrationStats);
    }
  }, []);

  const fetchBotStatus = useCallback(async () => {
    const result = await getBotStatus();
    if (result.success && result.data) {
      setBotStatus(result.data as BotStatusInfo);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchStats();
    fetchBotStatus();
  }, [fetchConfig, fetchStats, fetchBotStatus]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    startTransition(async () => {
      try {
        let result;
        if (config) {
          const updateData: Record<string, string> = {};
          if (formData.botToken) updateData.botToken = formData.botToken;
          if (formData.guildId) updateData.guildId = formData.guildId;
          if (formData.clientId) updateData.clientId = formData.clientId;
          if (formData.clientSecret)
            updateData.clientSecret = formData.clientSecret;
          if (formData.publicKey) updateData.publicKey = formData.publicKey;

          result = await updateDiscordConfigAction(config.id, updateData);
        } else {
          result = await createDiscordConfig({
            botToken: formData.botToken,
            guildId: formData.guildId,
            clientId: formData.clientId,
            clientSecret: formData.clientSecret || undefined,
            publicKey: formData.publicKey || undefined,
          });
        }

        if (result.success) {
          setSuccessMessage("Configuration saved successfully");
          fetchConfig();
          fetchStats();
          setFormData((prev) => ({
            ...prev,
            botToken: "",
            clientSecret: "",
            publicKey: "",
          }));
        } else {
          setErrorMessage(result.error || "Failed to save configuration");
        }
      } catch (error) {
        setErrorMessage("An unexpected error occurred");
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleSyncServer = async () => {
    setSuccessMessage("");
    setErrorMessage("");
    try {
      await fetchStats();
      await fetchBotStatus();
      setSuccessMessage("Server synced successfully");
    } catch (error) {
      setErrorMessage("Failed to sync server");
    }
  };

  const handleTestWebhook = async () => {
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const result = await testDiscordWebhook("test");
      if (result.success) {
        setSuccessMessage("Test webhook sent successfully");
      } else {
        setErrorMessage(result.error || "Failed to send test webhook");
      }
    } catch (error) {
      setErrorMessage("Failed to send test webhook");
    }
  };

  const formatUptime = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const statCards = [
    {
      title: "Bot Status",
      value: botStatus ? BOT_STATUS_LABELS[botStatus.status] : "Unknown",
      icon: <Bot className="h-4 w-4" />,
      color: botStatus
        ? BOT_STATUS_COLORS[botStatus.status]
        : "bg-gray-100 text-gray-800",
    },
    {
      title: "Guilds",
      value: stats?.guildCount ?? 0,
      icon: <Server className="h-4 w-4" />,
    },
    {
      title: "Channels",
      value: stats?.channelCount ?? 0,
      icon: <Hash className="h-4 w-4" />,
    },
    {
      title: "Roles",
      value: stats?.roleCount ?? 0,
      icon: <Shield className="h-4 w-4" />,
    },
    {
      title: "Webhooks",
      value: stats?.webhookCount ?? 0,
      icon: <Webhook className="h-4 w-4" />,
    },
    {
      title: "Automations",
      value: stats?.automationCount ?? 0,
      icon: <Zap className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Discord Integration
          </h1>
          <p className="text-muted-foreground">
            Configure and manage your Discord bot integration
          </p>
        </div>
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Join Discord
        </a>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-500"
          >
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          {statCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className="text-muted-foreground">{card.icon}</div>
              </CardHeader>
              <CardContent>
                {card.color ? (
                  <Badge className={card.color}>{card.value}</Badge>
                ) : (
                  <div className="text-2xl font-bold">{card.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bot Configuration
            </CardTitle>
            <CardDescription>
              Configure your Discord bot credentials and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <div className="relative">
                    <Input
                      id="botToken"
                      type={showToken ? "text" : "password"}
                      placeholder={
                        config ? "••••••••••••••••••••••••" : "Enter bot token"
                      }
                      value={formData.botToken}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          botToken: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guildId">Guild ID</Label>
                  <Input
                    id="guildId"
                    placeholder="Enter Discord guild ID"
                    value={formData.guildId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        guildId: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="Enter Discord client ID"
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientId: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="clientSecret"
                      type={showSecret ? "text" : "password"}
                      placeholder={
                        config ? "••••••••••••••••••••••••" : "Enter client secret"
                      }
                      value={formData.clientSecret}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          clientSecret: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publicKey">Public Key</Label>
                  <div className="relative">
                    <Input
                      id="publicKey"
                      type={showPublicKey ? "text" : "password"}
                      placeholder={
                        config ? "••••••••••••••••••••••••" : "Enter public key"
                      }
                      value={formData.publicKey}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          publicKey: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPublicKey(!showPublicKey)}
                    >
                      {showPublicKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || !formData.guildId || !formData.clientId}
                  className="w-full"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {config ? "Update Configuration" : "Save Configuration"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bot Status Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Bot Status
            </CardTitle>
            <CardDescription>
              Current bot status and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                ))}
              </div>
            ) : botStatus ? (
              <>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    {botStatus.status === "ONLINE" ? (
                      <div className="relative">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-500 opacity-75" />
                      </div>
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-gray-400" />
                    )}
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">
                        {BOT_STATUS_LABELS[botStatus.status]}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={BOT_STATUS_COLORS[botStatus.status]}
                  >
                    {botStatus.status === "ONLINE" ? (
                      <Wifi className="mr-1 h-3 w-3" />
                    ) : (
                      <WifiOff className="mr-1 h-3 w-3" />
                    )}
                    {BOT_STATUS_LABELS[botStatus.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Latency
                    </div>
                    <p className="mt-1 text-lg font-semibold">
                      {botStatus.latency
                        ? `${botStatus.latency}ms`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      Uptime
                    </div>
                    <p className="mt-1 text-lg font-semibold">
                      {formatUptime(botStatus.uptime ?? null)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Guilds</span>
                    <span className="font-medium">{botStatus.guildCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Channels</span>
                    <span className="font-medium">{botStatus.channelCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Roles</span>
                    <span className="font-medium">{botStatus.roleCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Users</span>
                    <span className="font-medium">{botStatus.userCount}</span>
                  </div>
                </div>

                {botStatus.lastCheckedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last checked:{" "}
                    {new Date(botStatus.lastCheckedAt).toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <Bot className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Bot not configured
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure your Discord bot to see status information
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Perform common Discord integration tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={handleSyncServer}
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span className="font-medium">Sync Server</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Sync roles, channels, and members
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={handleTestWebhook}
            >
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                <span className="font-medium">Test Webhook</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Send a test webhook message
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={() =>
                window.open("/dashboard/discord/logs", "_blank")
              }
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">View Logs</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Check activity and webhook logs
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
