import { type ButtonHTMLAttributes, forwardRef, useState } from "react";

// =====================================================
// Switch Component
// =====================================================

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className = "", checked: controlledChecked, onCheckedChange, defaultChecked = false, ...props }, ref) => {
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
    const checked = controlledChecked ?? uncontrolledChecked;
    const handleCheckedChange = onCheckedChange ?? setUncontrolledChecked;

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-[#171717]" : "bg-[#ebebeb]"
        } ${className}`}
        onClick={() => handleCheckedChange(!checked)}
        {...props}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";
