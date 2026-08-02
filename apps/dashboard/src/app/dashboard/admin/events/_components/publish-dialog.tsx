"use client";

import { Loader2, Globe, ArrowUpFromLine } from "lucide-react";

import { Button } from "@gameverse/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gameverse/ui/dialog";

interface PublishEventDialogProps {
  eventTitle: string;
  isPublished: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export function PublishEventDialog({
  eventTitle,
  isPublished,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: PublishEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPublished ? (
              <ArrowUpFromLine className="h-5 w-5" />
            ) : (
              <Globe className="h-5 w-5" />
            )}
            {isPublished ? "Unpublish Event" : "Publish Event"}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? `Are you sure you want to unpublish "${eventTitle}"? It will no longer be visible to attendees.`
              : `Are you sure you want to publish "${eventTitle}"? It will become visible to attendees based on its visibility settings.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isPublished ? (
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
