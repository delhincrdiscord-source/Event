import { type InputHTMLAttributes, forwardRef, useState } from "react";

// =====================================================
// Checkbox Component
// =====================================================

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", checked: controlledChecked, onCheckedChange, defaultChecked = false, ...props }, ref) => {
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
    const checked = controlledChecked ?? uncontrolledChecked;
    const handleCheckedChange = onCheckedChange ?? setUncontrolledChecked;

    return (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={() => handleCheckedChange(!checked)}
          {...props}
        />
        <div
          className={`h-4 w-4 shrink-0 rounded-sm border border-[#ebebeb] bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            checked ? "bg-[#171717] border-[#171717] text-white" : ""
          } ${className}`}
          aria-hidden="true"
        >
          {checked && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full p-px"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
