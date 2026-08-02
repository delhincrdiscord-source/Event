"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Label } from "@gameverse/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gameverse/ui/dialog";

import { duplicateAnnouncement } from "../_actions/announcement";
import type { AnnouncementWithRelations } from "@gameverse/types";

interface DuplicateAnnouncementDialogProps {
  announcement: AnnouncementWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateAnnouncementDialog({
  announcement,
  open,
  onOpenChange,
}: DuplicateAnnouncementDialogProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [title, setTitle] = useState(`${announcement.title} (Copy)`);
  const [slug, setSlug] = useState(`${announcement.slug}-copy`);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const handleDuplicate = async () => {
    if (!title || !slug) {
      setError("Title and slug are required");
      return;
    }

    setIsDuplicating(true);
    setError(null);

    const result = await duplicateAnnouncement(announcement.id, { title, slug });

    if (result.success && result.data) {
      onOpenChange(false);
      router.push(`/dashboard/announcements/${result.data.id}/edit`);
    } else {
      setError(result.success ? "" : (result.error ?? "Failed to duplicate announcement"));
    }
    setIsDuplicating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Announcement
          </DialogTitle>
          <DialogDescription>
            Create a copy of &quot;{announcement.title}&quot; with a new title.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="dup-title">Title</Label>
            <Input
              id="dup-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dup-slug">Slug</Label>
            <Input
              id="dup-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={isDuplicating}>
            {isDuplicating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
