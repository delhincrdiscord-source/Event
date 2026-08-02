import { type ButtonHTMLAttributes, forwardRef } from "react";

// =====================================================
// Button Component
// =====================================================

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "destructive" | "default" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles: Record<string, string> = {
      primary: "bg-[#171717] text-white hover:bg-[#333333] focus:ring-[#171717]",
      secondary: "bg-white text-[#171717] border border-[#ebebeb] hover:bg-[#fafafa] focus:ring-[#171717]",
      ghost: "bg-transparent text-[#171717] hover:bg-[#fafafa] focus:ring-[#171717]",
      danger: "bg-[#ee0000] text-white hover:bg-[#c50000] focus:ring-[#ee0000]",
      outline: "bg-transparent text-[#171717] border border-[#ebebeb] hover:bg-[#fafafa] focus:ring-[#171717]",
      destructive: "bg-[#ee0000] text-white hover:bg-[#c50000] focus:ring-[#ee0000]",
      default: "bg-white text-[#171717] border border-[#ebebeb] hover:bg-[#fafafa] focus:ring-[#171717]",
      link: "text-[#171717] underline-offset-4 hover:underline focus:ring-[#171717]",
    };

    const sizeStyles: Record<string, string> = {
      sm: "px-3 py-1.5 text-sm h-8",
      md: "px-4 py-2 text-sm h-10",
      lg: "px-6 py-3 text-base h-12",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
