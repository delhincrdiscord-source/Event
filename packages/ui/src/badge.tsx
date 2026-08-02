import { type HTMLAttributes, forwardRef } from "react";

// =====================================================
// Badge Component
// =====================================================

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline" | "destructive" | "secondary";
  size?: "sm" | "md";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", size = "sm", children, ...props }, ref) => {
    const variantStyles: Record<string, string> = {
      default: "bg-[#fafafa] text-[#4d4d4d]",
      success: "bg-[#d3e5ff] text-[#0070f3]",
      warning: "bg-[#ffefcf] text-[#ab570a]",
      error: "bg-[#f7d4d6] text-[#c50000]",
      info: "bg-[#d3e5ff] text-[#0761d1]",
      outline: "bg-transparent text-[#171717] border border-[#ebebeb]",
      destructive: "bg-[#f7d4d6] text-[#c50000]",
      secondary: "bg-[#fafafa] text-[#4d4d4d]",
    };

    const sizeStyles = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
