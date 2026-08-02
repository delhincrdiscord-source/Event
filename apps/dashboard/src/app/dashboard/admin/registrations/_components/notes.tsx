"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Trash2, Lock, Globe, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Textarea } from "@gameverse/ui/textarea";
import { Switch } from "@gameverse/ui/switch";
import { Label } from "@gameverse/ui/label";
import { Separator } from "@gameverse/ui/separator";

import { addRegistrationNote } from "../_actions/registration";
import type { RegistrationNote } from "@gameverse/types";

interface RegistrationNotesProps {
  registrationId: string;
  notes: RegistrationNote[];
  onNoteAdded: () => void;
}

function formatTimestamp(date: Date) {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RegistrationNotes({
  registrationId,
  notes,
  onNoteAdded,
}: RegistrationNotesProps) {
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    startTransition(async () => {
      const result = await addRegistrationNote({
        registrationId,
        content: content.trim(),
        isInternal,
      });

      if (result.success) {
        setContent("");
        onNoteAdded();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Textarea
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="internal-note"
              checked={isInternal}
              onCheckedChange={setIsInternal}
            />
            <Label htmlFor="internal-note" className="text-sm text-muted-foreground">
              {isInternal ? (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Internal note
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Visible to user
                </span>
              )}
            </Label>
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Add Note
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No notes yet
          </p>
        ) : (
          <AnimatePresence>
            {[...notes].reverse().map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-lg border p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {note.author?.username || "System"}
                      </span>
                      {note.isInternal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                          <Lock className="h-3 w-3" /> Internal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                          <Globe className="h-3 w-3" /> Public
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTimestamp(note.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
