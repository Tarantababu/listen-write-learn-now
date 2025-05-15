
import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

// Define the toast types
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast> & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

// Create a custom hook that provides toast functionality
const toasts: ToastProps[] = [];

const useToast = () => {
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
  const { toast: toastFn } = useToast();
  return toastFn(props);
};

// Add toasts property to the toast function for compatibility
toast.toasts = toasts;

// Helper function for showing a refresh message
export const showRefreshMessage = (message: string) => {
  toast({
    title: "Data refreshed",
    description: message,
  });
};

export { useToast };
