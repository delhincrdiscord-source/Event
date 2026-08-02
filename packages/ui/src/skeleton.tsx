import { type HTMLAttributes, forwardRef } from "react";

// =====================================================
// Skeleton Component
// =====================================================

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`animate-pulse rounded-md bg-[#ebebeb] ${className}`}
      {...props}
    />
  )
);

Skeleton.displayName = "Skeleton";
