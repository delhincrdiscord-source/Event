import {
  type HTMLAttributes,
  type SelectHTMLAttributes,
  type OptionHTMLAttributes,
  forwardRef,
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

// =====================================================
// Select Context
// =====================================================

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue>({
  value: "",
  onValueChange: () => {},
  open: false,
  onOpenChange: () => {},
});

// =====================================================
// Select
// =====================================================

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Select({ value: controlledValue, onValueChange, defaultValue = "", disabled, children }: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const value = controlledValue ?? uncontrolledValue;
  const handleValueChange = onValueChange ?? setUncontrolledValue;

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, onOpenChange: setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// =====================================================
// SelectTrigger
// =====================================================

export interface SelectTriggerProps extends HTMLAttributes<HTMLButtonElement> {}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className = "", children, ...props }, ref) => {
    const { open, onOpenChange } = useContext(SelectContext);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.parentElement?.contains(e.target as Node)) {
          onOpenChange(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onOpenChange]);

    return (
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border border-[#ebebeb] dark:border-[#333] bg-white dark:bg-[#1a1a1a] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] placeholder:text-[#888888] dark:placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-[#5865F2] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        {...props}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    );
  }
);

SelectTrigger.displayName = "SelectTrigger";

// =====================================================
// SelectValue
// =====================================================

export interface SelectValueProps extends HTMLAttributes<HTMLSpanElement> {
  placeholder?: string;
}

export const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className = "", placeholder, ...props }, ref) => {
    const { value } = useContext(SelectContext);

    return (
      <span ref={ref} className={className} {...props}>
        {value || placeholder}
      </span>
    );
  }
);

SelectValue.displayName = "SelectValue";

// =====================================================
// SelectContent
// =====================================================

export interface SelectContentProps extends HTMLAttributes<HTMLDivElement> {}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className = "", children, ...props }, ref) => {
    const { open } = useContext(SelectContext);

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[#ebebeb] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-1 text-[#171717] dark:text-[#ededed] shadow-md animate-in fade-in-0 zoom-in-95 ${className}`}
        role="listbox"
        {...props}
      >
        {children}
      </div>
    );
  }
);

SelectContent.displayName = "SelectContent";

// =====================================================
// SelectItem
// =====================================================

export interface SelectItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className = "", value: itemValue, children, ...props }, ref) => {
    const { value, onValueChange, onOpenChange } = useContext(SelectContext);
    const isSelected = value === itemValue;

    return (
      <div
        ref={ref}
        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-[#fafafa] dark:hover:bg-[#222] focus:bg-[#fafafa] dark:focus:bg-[#222] ${
          isSelected ? "bg-[#fafafa] dark:bg-[#222] font-medium" : ""
        } ${className}`}
        role="option"
        aria-selected={isSelected}
        onClick={() => {
          onValueChange(itemValue);
          onOpenChange(false);
        }}
        {...props}
      >
        {isSelected && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
        {children}
      </div>
    );
  }
);

SelectItem.displayName = "SelectItem";
