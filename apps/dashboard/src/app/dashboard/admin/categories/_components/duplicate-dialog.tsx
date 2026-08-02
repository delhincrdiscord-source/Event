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

import { duplicateCategory } from "../_actions/category";
import type { EventCategoryListItem } from "@gameverse/types";

interface DuplicateCategoryDialogProps {
  category: EventCategoryListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateCategoryDialog({
  category,
  open,
  onOpenChange,
}: DuplicateCategoryDialogProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [name, setName] = useState(`${category.name} (Copy)`);
  const [slug, setSlug] = useState(`${category.slug}-copy`);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleDuplicate = async () => {
    if (!name || !slug) {
      setError("Name and slug are required");
      return;
    }

    setIsDuplicating(true);
    setError(null);

    const result = await duplicateCategory({
      id: category.id,
      name,
      slug,
    });

    if (result.success && result.data) {
      onOpenChange(false);
      router.push(`/dashboard/categories/${result.data.id}/edit`);
    } else {
      setError(result.success ? "" : (result.error ?? "Failed to duplicate category"));
    }
    setIsDuplicating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Category
          </DialogTitle>
          <DialogDescription>
            Create a copy of &quot;{category.name}&quot; with a new name and slug.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="dup-name">Name</Label>
            <Input
              id="dup-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
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
