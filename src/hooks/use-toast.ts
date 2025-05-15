
import { toast as sonnerToast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  action?: React.ReactNode;
  toasts?: any[];
};

export function useToast() {
  const toast = ({ title, description, variant = 'default', action }: ToastProps) => {
    sonnerToast(title, {
      description,
      action,
      className: variant === 'destructive' 
        ? 'bg-destructive text-destructive-foreground border-destructive' 
        : variant === 'success'
        ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500'
        : undefined
    });
  };

  // Add the toasts property to make it compatible with the Toaster component
  toast.toasts = [];

  return { toast };
}

export const toast = ({ title, description, variant, action }: ToastProps) => {
  sonnerToast(title, {
    description,
    action,
    className: variant === 'destructive' 
      ? 'bg-destructive text-destructive-foreground border-destructive' 
      : variant === 'success'
      ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500'
      : undefined
  });
};

// Add the toasts property to make it compatible with the Toaster component
toast.toasts = [];
