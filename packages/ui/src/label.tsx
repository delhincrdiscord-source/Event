import { type LabelHTMLAttributes, forwardRef } from "react";

// =====================================================
// Label Component
// =====================================================

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", children, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium text-[#171717] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  )
);

Label.displayName = "Label";
