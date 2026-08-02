import React, {
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  isValidElement,
  cloneElement,
} from "react";

// =====================================================
// Dialog Context
// =====================================================

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
});

// =====================================================
// Dialog
// =====================================================

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const handleOpenChange = onOpenChange ?? setUncontrolledOpen;

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

// =====================================================
// DialogTrigger
// =====================================================

export interface DialogTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className = "", onClick, children, asChild, ...props }, ref) => {
    const { onOpenChange } = useContext(DialogContext);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        ref,
        onClick: (e: React.MouseEvent) => {
          const childOnClick = (children as React.ReactElement<Record<string, unknown>>).props?.onClick;
          if (typeof childOnClick === "function") childOnClick(e);
          if (onClick) onClick(e as React.MouseEvent<HTMLButtonElement>);
          onOpenChange(true);
        },
      });
    }

    return (
      <button
        ref={ref}
        className={className}
        onClick={(e) => {
          onClick?.(e);
          onOpenChange(true);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DialogTrigger.displayName = "DialogTrigger";

// =====================================================
// DialogContent
// =====================================================

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = "", children, ...props }, ref) => {
    const { open, onOpenChange } = useContext(DialogContext);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false);
        }
      },
      [onOpenChange]
    );

    useEffect(() => {
      if (open) {
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
          document.removeEventListener("keydown", handleKeyDown);
          document.body.style.overflow = "";
        };
      }
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50">
        <div
          className="fixed inset-0 bg-black/80"
          onClick={() => onOpenChange(false)}
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div
            ref={ref}
            className={`relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg animate-in fade-in-0 zoom-in-95 ${className}`}
            role="dialog"
            aria-modal="true"
            {...props}
          >
            {children}
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

DialogContent.displayName = "DialogContent";

// =====================================================
// DialogHeader
// =====================================================

export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
      {...props}
    />
  )
);

DialogHeader.displayName = "DialogHeader";

// =====================================================
// DialogFooter
// =====================================================

export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    />
  )
);

DialogFooter.displayName = "DialogFooter";

// =====================================================
// DialogTitle
// =====================================================

export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className = "", ...props }, ref) => (
    <h2
      ref={ref}
      className={`text-lg font-semibold text-[#171717] leading-none tracking-tight ${className}`}
      {...props}
    />
  )
);

DialogTitle.displayName = "DialogTitle";

// =====================================================
// DialogDescription
// =====================================================

export interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className = "", ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-[#888888] ${className}`}
      {...props}
    />
  )
);

DialogDescription.displayName = "DialogDescription";

// =====================================================
// DialogClose
// =====================================================

export interface DialogCloseProps extends HTMLAttributes<HTMLButtonElement> {}

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className = "", onClick, children, ...props }, ref) => {
    const { onOpenChange } = useContext(DialogContext);

    return (
      <button
        ref={ref}
        className={className}
        onClick={(e) => {
          onClick?.(e);
          onOpenChange(false);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DialogClose.displayName = "DialogClose";
