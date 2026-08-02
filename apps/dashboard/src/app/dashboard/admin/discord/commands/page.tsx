"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Terminal, Plus, Search, MoreHorizontal, Trash2, Loader2, ToggleLeft, ToggleRight, Code,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Label } from "@gameverse/ui/label";

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
import { Skeleton } from "@gameverse/ui/skeleton";
import { Switch } from "@gameverse/ui/switch";
import { Textarea } from "@gameverse/ui/textarea";

import {
  getDiscordSlashCommands,
  createDiscordSlashCommandAction,
  updateDiscordSlashCommandAction,
  deleteDiscordSlashCommandAction,
} from "../_actions/discord";
import type { DiscordSlashCommand } from "@gameverse/types";

export default function SlashCommandsPage() {
  const [isPending, startTransition] = useTransition();
  const [commands, setCommands] = useState<DiscordSlashCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCommand, setSelectedCommand] =
    useState<DiscordSlashCommand | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    isGlobal: true,
    isEnabled: true,
  });

  const fetchCommands = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDiscordSlashCommands();
      if (result.success && result.data) {
        setCommands(result.data as DiscordSlashCommand[]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  const handleCreateCommand = async () => {
    if (!createForm.name || !createForm.description) return;

    startTransition(async () => {
      const result = await createDiscordSlashCommandAction({
        name: createForm.name,
        description: createForm.description,
        isGlobal: createForm.isGlobal,
        isEnabled: createForm.isEnabled,
      });
      if (result.success) {
        setCreateDialogOpen(false);
        setCreateForm({
          name: "",
          description: "",
          isGlobal: true,
          isEnabled: true,
        });
        fetchCommands();
      }
    });
  };

  const handleToggleEnabled = async (command: DiscordSlashCommand) => {
    startTransition(async () => {
      await updateDiscordSlashCommandAction(command.id, {
        isEnabled: !command.isEnabled,
      });
      fetchCommands();
    });
  };

  const handleDeleteCommand = async (id: string) => {
    startTransition(async () => {
      await deleteDiscordSlashCommandAction(id);
      fetchCommands();
    });
  };

  const filteredCommands = commands.filter((command) =>
    command.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Slash Commands</h2>
          <p className="text-muted-foreground">
            Manage custom Discord slash commands for your server.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Command
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Command List</CardTitle>
              <CardDescription>
                View and manage all your Discord slash commands
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
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
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-6 w-[70px]" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Terminal className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No commands found
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search" :"Create your first slash command to get started"}
              </p>
              {!searchQuery && (
                <Button
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Command
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                <span className="text-sm font-medium w-[150px]">Name</span>
                <span className="text-sm font-medium w-[200px]">
                  Description
                </span>
                <span className="text-sm font-medium w-[100px]">
                  Usage Count
                </span>
                <span className="text-sm font-medium w-[120px]">Last Used</span>
                <span className="text-sm font-medium w-[100px]">Enabled</span>
                <span className="ml-auto text-sm font-medium">Actions</span>
              </div>

              {/* Command Items */}
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredCommands.map((command) => (
                    <motion.div
                      key={command.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="w-[150px] min-w-0">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">
                            /{command.name}
                          </span>
                        </div>
                      </div>
                      <div className="w-[200px] text-sm text-muted-foreground truncate">
                        {command.description}
                      </div>
                      <div className="w-[100px] text-sm text-muted-foreground">
                        {command.usageCount}
                      </div>
                      <div className="w-[120px] text-sm text-muted-foreground">
                        {formatDate(command.lastUsedAt ?? null)}
                      </div>
                      <div className="w-[100px]">
                        <Switch
                          checked={command.isEnabled}
                          onCheckedChange={() =>
                            handleToggleEnabled(command)
                          }
                          disabled={isPending}
                        />
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
                                handleToggleEnabled(command)
                              }
                            >
                              {command.isEnabled ? (
                                <ToggleLeft className="mr-2 h-4 w-4" />
                              ) : (
                                <ToggleRight className="mr-2 h-4 w-4" />
                              )}
                              {command.isEnabled
                                ? "Disable" :"Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCommand(command);
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

      {/* Create Command Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[475px]">
          <DialogHeader>
            <DialogTitle>Create Slash Command</DialogTitle>
            <DialogDescription>
              Create a new Discord slash command for your bot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commandName">Name</Label>
              <Input
                id="commandName"
                placeholder="Enter command name (without /)"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    name: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Command will be registered as /{createForm.name || "command-name"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commandDescription">Description</Label>
              <Textarea
                id="commandDescription"
                placeholder="Enter command description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="commandGlobal">Global Command</Label>
                <p className="text-sm text-muted-foreground">
                  Available in all servers
                </p>
              </div>
              <Switch
                id="commandGlobal"
                checked={createForm.isGlobal}
                onCheckedChange={(checked) =>
                  setCreateForm((prev) => ({ ...prev, isGlobal: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="commandEnabled">Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Command is active and usable
                </p>
              </div>
              <Switch
                id="commandEnabled"
                checked={createForm.isEnabled}
                onCheckedChange={(checked) =>
                  setCreateForm((prev) => ({ ...prev, isEnabled: checked }))
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
              onClick={handleCreateCommand}
              disabled={
                isPending || !createForm.name || !createForm.description
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

      {/* Delete Command Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Command
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>/{selectedCommand?.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedCommand) {
                  handleDeleteCommand(selectedCommand.id);
                  setDeleteDialogOpen(false);
                  setSelectedCommand(null);
                }
              }}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
