
import * as React from "react";
import type { Toast as ToastPrimitive } from "@radix-ui/react-toast";

// Define the toast types
export type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive> & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

// Create a toast store
const toasts: ToastProps[] = [];

// Create a custom hook that provides toast functionality
export const useToast = () => {
  const [, setToast] = React.useState<ToastProps[]>(toasts);

  const toast = React.useCallback(
    ({ ...props }: Omit<ToastProps, "id">) => {
      const id = String(Math.random());
      const newToast = { id, ...props };
      toasts.push(newToast);
      setToast([...toasts]);
      return newToast;
    },
    [setToast]
  );

  // Function to dismiss a toast
  const dismiss = React.useCallback((toastId?: string) => {
    const index = toastId
      ? toasts.findIndex((toast) => toast.id === toastId)
      : toasts.length - 1;

    if (index !== -1) {
      toasts.splice(index, 1);
      setToast([...toasts]);
    }
  }, [setToast]);

  return {
    toast,
    dismiss,
    toasts,
  };
};

// Export individual function to use outside of React components
export const toast = (props: Omit<ToastProps, "id">) => {
  // Create a fake hook result that mimics the real hook
  const toastFn = (props: Omit<ToastProps, "id">) => {
    const id = String(Math.random());
    const newToast = { id, ...props };
    toasts.push(newToast);
    return newToast;
  };
  
  return toastFn(props);
};

// Add toasts property to the toast function for compatibility
toast.toasts = toasts;
