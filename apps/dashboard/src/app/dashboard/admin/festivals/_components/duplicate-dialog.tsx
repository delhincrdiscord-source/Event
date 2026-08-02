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

import { duplicateFestival } from "../_actions/festival";
import type { Festival } from "@gameverse/types";

interface DuplicateFestivalDialogProps {
  festival: Festival;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateFestivalDialog({
  festival,
  open,
  onOpenChange,
}: DuplicateFestivalDialogProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [name, setName] = useState(`${festival.name} (Copy)`);
  const [slug, setSlug] = useState(`${festival.slug}-copy`);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
    if (!name || !slug || !startDate || !endDate) {
      setError("All fields are required");
      return;
    }

    setIsDuplicating(true);
    setError(null);

    const result = await duplicateFestival({
      id: festival.id,
      name,
      slug,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });

    if (result.success && result.data) {
      onOpenChange(false);
      router.push(`/dashboard/festivals/${result.data.id}/edit`);
    } else {
      setError(!result.success ? (result.error ?? "Failed to duplicate festival") : "");
    }
    setIsDuplicating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Festival
          </DialogTitle>
          <DialogDescription>
            Create a copy of "{festival.name}" with new dates.
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dup-start">Start Date</Label>
              <Input
                id="dup-start"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dup-end">End Date</Label>
              <Input
                id="dup-end"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
