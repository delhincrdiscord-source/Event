"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Textarea } from "@gameverse/ui/textarea";
import { Label } from "@gameverse/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gameverse/ui/dialog";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "reject" | "waitlist";
  registrationPassNumber: string;
  onConfirm: (reason?: string) => void;
  isPending?: boolean;
}

const ACTION_CONFIG = {
  approve: {
    title: "Approve Registration",
    description:
      "This will approve the registration and allow the user to check in.",
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    buttonVariant: "default" as const,
    buttonClass: "bg-green-600 hover:bg-green-700",
    label: "Approve",
  },
  reject: {
    title: "Reject Registration",
    description:
      "This will reject the registration. The user will be notified.",
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    buttonVariant: "destructive" as const,
    buttonClass: "",
    label: "Reject",
  },
  waitlist: {
    title: "Waitlist Registration",
    description:
      "This will move the registration to the waitlist. The user will be notified.",
    icon: <AlertCircle className="h-5 w-5 text-blue-600" />,
    buttonVariant: "outline" as const,
    buttonClass: "border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950",
    label: "Waitlist",
  },
};

export function ApprovalDialog({
  open,
  onOpenChange,
  action,
  registrationPassNumber,
  onConfirm,
  isPending = false,
}: ApprovalDialogProps) {
  const [reason, setReason] = useState("");
  const config = ACTION_CONFIG[action];

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setReason("");
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description} Pass: <strong>{registrationPassNumber}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason (optional)
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter a reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant={config.buttonVariant}
            className={config.buttonClass}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {config.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
