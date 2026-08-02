import { type InputHTMLAttributes, forwardRef } from "react";

// =====================================================
// Input Component
// =====================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm bg-white dark:bg-[#1a1a1a] text-[#171717] dark:text-[#ededed] border rounded-md focus:outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-[#5865F2] focus:border-transparent disabled:bg-[#fafafa] dark:disabled:bg-[#111] disabled:cursor-not-allowed placeholder:text-[#999] dark:placeholder:text-[#666] ${
            error
              ? "border-[#ee0000] focus:ring-[#ee0000]"
              : "border-[#ebebeb] dark:border-[#333]"
          } ${className}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-[#ee0000]"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-sm text-[#888888]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
