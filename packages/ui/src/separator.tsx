import { type HTMLAttributes, forwardRef } from "react";

// =====================================================
// Separator Component
// =====================================================

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className = "", orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      className={`shrink-0 bg-[#ebebeb] ${
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px"
      } ${className}`}
      role="separator"
      aria-orientation={orientation}
      {...props}
    />
  )
);

Separator.displayName = "Separator";
