import { type TextareaHTMLAttributes, forwardRef } from "react";

// =====================================================
// Textarea Component
// =====================================================

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`flex min-h-[80px] w-full rounded-md border border-[#ebebeb] dark:border-[#333] bg-white dark:bg-[#1a1a1a] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] placeholder:text-[#888888] dark:placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-[#5865F2] focus:border-transparent disabled:bg-[#fafafa] dark:disabled:bg-[#111] disabled:cursor-not-allowed resize-none ${className}`}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
