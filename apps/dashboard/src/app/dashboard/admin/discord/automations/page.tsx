"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Zap,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
  Clock,
  Loader2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Hash,
  Bell,
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
import { Switch } from "@gameverse/ui/switch";
import { Textarea } from "@gameverse/ui/textarea";

import {
  getDiscordAutomations,
  createDiscordAutomationAction,
  updateDiscordAutomationAction,
  deleteDiscordAutomationAction,
} from "../_actions/discord";
import { DeleteAutomationDialog } from "../_components";
import type {
  DiscordAutomation,
  AutomationTrigger,
  AutomationAction,
} from "@gameverse/types";
import {
  AUTOMATION_TRIGGER_LABELS,
  AUTOMATION_ACTION_LABELS,
} from "@gameverse/types";

export default function AutomationsPage() {
  const [isPending, startTransition] = useTransition();
  const [automations, setAutomations] = useState<DiscordAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] =
    useState<DiscordAutomation | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    trigger: "" as AutomationTrigger | "",
    action: "" as AutomationAction | "",
    channelId: "",
    roleId: "",
    messageTemplate: "",
  });

  const fetchAutomations = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDiscordAutomations();
      if (result.success && result.data) {
        setAutomations(result.data as DiscordAutomation[]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const handleCreateAutomation = async () => {
    if (
      !createForm.name ||
      !createForm.trigger ||
      !createForm.action
    )
      return;

    startTransition(async () => {
      const result = await createDiscordAutomationAction({
        name: createForm.name,
        description: createForm.description || undefined,
        trigger: createForm.trigger as AutomationTrigger,
        action: createForm.action as AutomationAction,
        channelId: createForm.channelId || undefined,
        roleId: createForm.roleId || undefined,
        messageTemplate: createForm.messageTemplate || undefined,
        isActive: true,
      });
      if (result.success) {
        setCreateDialogOpen(false);
        setCreateForm({
          name: "",
          description: "",
          trigger: "",
          action: "",
          channelId: "",
          roleId: "",
          messageTemplate: "",
        });
        fetchAutomations();
      }
    });
  };

  const handleDeleteAutomation = async () => {
    if (!selectedAutomation) return;
    startTransition(async () => {
      const result = await deleteDiscordAutomationAction(selectedAutomation.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedAutomation(null);
        fetchAutomations();
      }
    });
  };

  const handleToggleActive = async (automation: DiscordAutomation) => {
    startTransition(async () => {
      await updateDiscordAutomationAction(automation.id, {
        isActive: !automation.isActive,
      });
      fetchAutomations();
    });
  };

  const filteredAutomations = automations.filter((automation) =>
    automation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
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
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground">
            Create automated workflows for Discord events
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Automation
        </Button>
      </div>

      {/* Automation List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automation List</CardTitle>
              <CardDescription>
                View and manage all your Discord automations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search automations..."
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
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-6 w-[80px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredAutomations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Zap className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No automations found
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first automation to get started"}
              </p>
              {!searchQuery && (
                <Button
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Automation
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                <span className="text-sm font-medium w-[180px]">Name</span>
                <span className="text-sm font-medium w-[150px]">Trigger</span>
                <span className="text-sm font-medium w-[150px]">Action</span>
                <span className="text-sm font-medium w-[100px]">Status</span>
                <span className="text-sm font-medium w-[120px]">
                  Last Triggered
                </span>
                <span className="text-sm font-medium w-[80px]">Count</span>
                <span className="ml-auto text-sm font-medium">Actions</span>
              </div>

              {/* Automation Items */}
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredAutomations.map((automation) => (
                    <motion.div
                      key={automation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="w-[180px] min-w-0">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">
                            {automation.name}
                          </span>
                        </div>
                        {automation.description && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {automation.description}
                          </p>
                        )}
                      </div>
                      <div className="w-[150px]">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          <Bell className="mr-1 h-3 w-3" />
                          {AUTOMATION_TRIGGER_LABELS[automation.trigger]}
                        </Badge>
                      </div>
                      <div className="w-[150px]">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {AUTOMATION_ACTION_LABELS[automation.action]}
                        </Badge>
                      </div>
                      <div className="w-[100px]">
                        <Switch
                          checked={automation.isActive}
                          onCheckedChange={() =>
                            handleToggleActive(automation)
                          }
                          disabled={isPending}
                        />
                      </div>
                      <div className="w-[120px] text-sm text-muted-foreground">
                        {formatDate(automation.lastTriggeredAt ?? null)}
                      </div>
                      <div className="w-[80px] text-sm text-muted-foreground text-center">
                        {automation.triggerCount}
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
                              onClick={() =>
                                handleToggleActive(automation)
                              }
                            >
                              {automation.isActive ? (
                                <ToggleLeft className="mr-2 h-4 w-4" />
                              ) : (
                                <ToggleRight className="mr-2 h-4 w-4" />
                              )}
                              {automation.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAutomation(automation);
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

      {/* Create Automation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create Automation</DialogTitle>
            <DialogDescription>
              Create a new automated workflow for Discord events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="automationName">Name</Label>
              <Input
                id="automationName"
                placeholder="Enter automation name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="automationDescription">Description</Label>
              <Textarea
                id="automationDescription"
                placeholder="Enter automation description (optional)"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="automationTrigger">Trigger</Label>
                <Select
                  value={createForm.trigger}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      trigger: value as AutomationTrigger,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(
                        AUTOMATION_TRIGGER_LABELS
                      ) as [AutomationTrigger, string][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="automationAction">Action</Label>
                <Select
                  value={createForm.action}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      action: value as AutomationAction,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(
                        AUTOMATION_ACTION_LABELS
                      ) as [AutomationAction, string][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="automationMessage">Message Template</Label>
              <Textarea
                id="automationMessage"
                placeholder="Enter message template (optional)"
                value={createForm.messageTemplate}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    messageTemplate: e.target.value,
                  }))
                }
              />
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
              onClick={handleCreateAutomation}
              disabled={
                isPending ||
                !createForm.name ||
                !createForm.trigger ||
                !createForm.action
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

      {/* Delete Automation Dialog */}
      {selectedAutomation && (
        <DeleteAutomationDialog
          automationName={selectedAutomation.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteAutomation}
          isPending={isPending}
        />
      )}
    </div>
  );
}
