"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Webhook,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
  TestTube,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Clock,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gameverse/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gameverse/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  getDiscordWebhooks,
  createDiscordWebhookAction,
  updateDiscordWebhookAction,
  deleteDiscordWebhookAction,
  testDiscordWebhook,
  getDiscordWebhookLogs,
  retryFailedWebhookLogs,
  getDiscordChannels,
} from "../_actions/discord";
import { DeleteWebhookDialog } from "../_components";
import type {
  DiscordWebhookListItem,
  DiscordWebhookLogListItem,
  DiscordChannel,
} from "@gameverse/types";
import { WEBHOOK_STATUS_LABELS, WEBHOOK_STATUS_COLORS } from "@gameverse/types";

export default function WebhooksPage() {
  const [isPending, startTransition] = useTransition();
  const [webhooks, setWebhooks] = useState<DiscordWebhookListItem[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [logs, setLogs] = useState<DiscordWebhookLogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] =
    useState<DiscordWebhookListItem | null>(null);
  const [logPagination, setLogPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });
  const [createForm, setCreateForm] = useState({
    name: "",
    channelId: "",
  });

  const fetchWebhooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDiscordWebhooks();
      if (result.success && result.data) {
        setWebhooks(result.data as DiscordWebhookListItem[]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const result = await getDiscordWebhookLogs({
        page: logPagination.page,
        perPage: logPagination.perPage,
      });
      if (result.success && result.data) {
        const data = result.data as { logs: DiscordWebhookLogListItem[]; total: number; totalPages: number };
        setLogs(data.logs);
        setLogPagination((prev) => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      }
    } finally {
      setIsLoadingLogs(false);
    }
  }, [logPagination.page, logPagination.perPage]);

  const fetchChannels = useCallback(async () => {
    const result = await getDiscordChannels();
    if (result.success && result.data) {
      setChannels(result.data as DiscordChannel[]);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
    fetchChannels();
    fetchLogs();
  }, [fetchWebhooks, fetchChannels, fetchLogs]);

  const handleCreateWebhook = async () => {
    startTransition(async () => {
      const result = await createDiscordWebhookAction({
        name: createForm.name,
        channelId: createForm.channelId,
      });
      if (result.success) {
        setCreateDialogOpen(false);
        setCreateForm({ name: "", channelId: "" });
        fetchWebhooks();
        fetchLogs();
      }
    });
  };

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return;
    startTransition(async () => {
      const result = await deleteDiscordWebhookAction(selectedWebhook.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedWebhook(null);
        fetchWebhooks();
        fetchLogs();
      }
    });
  };

  const handleTestWebhook = async (id: string) => {
    startTransition(async () => {
      await testDiscordWebhook(id);
      fetchLogs();
    });
  };

  const handleRetryFailed = async () => {
    startTransition(async () => {
      await retryFailedWebhookLogs();
      fetchLogs();
    });
  };

  const handleLogPageChange = (newPage: number) => {
    setLogPagination((prev) => ({ ...prev, page: newPage }));
  };

  const filteredWebhooks = webhooks.filter((webhook) =>
    webhook.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Manage Discord webhooks for automated notifications
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      {/* Webhook List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook List</CardTitle>
              <CardDescription>
                View and manage all your Discord webhooks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search webhooks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 rounded-lg border p-4"
                >
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-6 w-[80px]" />
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredWebhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Webhook className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No webhooks found
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first webhook to get started"}
              </p>
              {!searchQuery && (
                <Button
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Webhook
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                <span className="text-sm font-medium w-[200px]">Name</span>
                <span className="text-sm font-medium w-[150px]">Channel</span>
                <span className="text-sm font-medium w-[100px]">Status</span>
                <span className="text-sm font-medium w-[80px]">Logs</span>
                <span className="ml-auto text-sm font-medium">Actions</span>
              </div>

              {/* Webhook Items */}
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredWebhooks.map((webhook) => (
                    <motion.div
                      key={webhook.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="w-[200px] min-w-0">
                        <div className="flex items-center gap-2">
                          <Webhook className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">
                            {webhook.name}
                          </span>
                        </div>
                      </div>
                      <div className="w-[150px] text-sm text-muted-foreground truncate">
                        #{webhook.channel?.name || "Unknown"}
                      </div>
                      <div className="w-[100px]">
                        <Badge
                          variant="outline"
                          className={
                            webhook.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          }
                        >
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="w-[80px] text-sm text-muted-foreground">
                        {webhook._count?.logs || 0}
                      </div>
                      <div className="ml-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleTestWebhook(webhook.id)}
                            >
                              <TestTube className="mr-2 h-4 w-4" />
                              Test Webhook
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateDiscordWebhookAction(webhook.id, {
                                  isActive: !webhook.isActive,
                                }).then(() => fetchWebhooks())
                              }
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {webhook.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedWebhook(webhook);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Webhook Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook Logs</CardTitle>
              <CardDescription>
                View webhook execution history and retry failed deliveries
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryFailed}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Retry Failed
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 rounded-lg border p-4"
                >
                  <Skeleton className="h-6 w-[80px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
              <p className="text-sm text-muted-foreground">
                Webhook execution logs will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Log Table Header */}
              <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                <span className="text-sm font-medium w-[100px]">Status</span>
                <span className="text-sm font-medium w-[120px]">Event</span>
                <span className="text-sm font-medium w-[150px]">Webhook</span>
                <span className="text-sm font-medium w-[100px]">Duration</span>
                <span className="text-sm font-medium w-[150px]">Timestamp</span>
              </div>

              {/* Log Items */}
              <div className="space-y-2">
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="w-[100px]">
                        <Badge className={WEBHOOK_STATUS_COLORS[log.status]}>
                          {log.status === "SUCCESS" && (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          )}
                          {log.status === "FAILED" && (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {WEBHOOK_STATUS_LABELS[log.status]}
                        </Badge>
                      </div>
                      <div className="w-[120px] text-sm">{log.eventType}</div>
                      <div className="w-[150px] text-sm text-muted-foreground truncate">
                        {log.webhook?.name || "Unknown"}
                      </div>
                      <div className="w-[100px] text-sm text-muted-foreground">
                        {log.durationMs ? `${log.durationMs}ms` : "N/A"}
                      </div>
                      <div className="w-[150px] text-sm text-muted-foreground">
                        {formatDate(log.executedAt)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {logPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(logPagination.page - 1) * logPagination.perPage + 1} to{" "}
                    {Math.min(
                      logPagination.page * logPagination.perPage,
                      logPagination.total
                    )}{" "}
                    of {logPagination.total} logs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleLogPageChange(logPagination.page - 1)
                      }
                      disabled={logPagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {logPagination.page} of {logPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleLogPageChange(logPagination.page + 1)
                      }
                      disabled={logPagination.page === logPagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Webhook Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Create a new Discord webhook for automated notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhookName">Name</Label>
              <Input
                id="webhookName"
                placeholder="Enter webhook name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookChannel">Channel</Label>
              <Select
                value={createForm.channelId}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, channelId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWebhook}
              disabled={
                isPending || !createForm.name || !createForm.channelId
              }
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Webhook Dialog */}
      {selectedWebhook && (
        <DeleteWebhookDialog
          webhookName={selectedWebhook.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteWebhook}
          isPending={isPending}
        />
      )}
    </div>
  );
}
