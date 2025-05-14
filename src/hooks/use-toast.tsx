
import * as React from "react";
import { createContext, useContext, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-500 bg-green-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type ToastProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive" | "success";
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onClose?: () => void;
};

export type ToastOptions = {
  variant?: "default" | "destructive" | "success";
  duration?: number;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export const useToast = () => {
  return useContext(ToastContext);
};

export interface ToastContextValue {
  toast: (options: ToastOptions | string) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  toasts: ToastProps[];
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  dismiss: () => {},
  dismissAll: () => {},
  toasts: [],
});

export function Toast({
  className,
  variant = "default",
  title,
  description,
  action,
  onClose,
  ...props
}: ToastProps) {
  return (
    <div
      className={cn(ToastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex flex-col gap-1 grow">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {action}
      <button
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  )
}

export const ToastProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [toasts, setToasts] = useState<
    Array<
      ToastProps & {
        id: string;
        timer?: ReturnType<typeof setTimeout>;
      }
    >
  >([]);

  const toast = React.useCallback(
    (options: ToastOptions | string) => {
      const id = Math.random().toString(36).slice(2);
      
      // Handle string shorthand
      const toastOptions = typeof options === "string"
        ? { description: options }
        : options;
        
      const { duration = 5000, ...restOptions } = toastOptions;

      const newToast = {
        id,
        ...restOptions,
        onClose: () => dismiss(id),
      };

      setToasts((toasts) => [...toasts, newToast]);

      // Auto-dismiss toast after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, duration);

        setToasts((toasts) =>
          toasts.map((t) => (t.id === id ? { ...t, timer } : t))
        );
      }

      return id;
    },
    []
  );

  const dismiss = React.useCallback((id: string) => {
    setToasts((toasts) => {
      const toast = toasts.find((t) => t.id === id);
      if (toast?.timer) {
        clearTimeout(toast.timer);
      }
      return toasts.filter((t) => t.id !== id);
    });
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts((toasts) => {
      toasts.forEach((toast) => {
        if (toast.timer) {
          clearTimeout(toast.timer);
        }
      });
      return [];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

// Export a standalone 'toast' function for convenience
export const toast = {
  // Function signature matches the toast method from ToastContextValue
  (options: ToastOptions | string) {
    return useToast().toast(options);
  },
  dismiss(id: string) {
    return useToast().dismiss(id);
  },
  dismissAll() {
    return useToast().dismissAll();
  },
  // Place to store toast instances for the Toaster component
  toasts: [] as ToastProps[],
};
