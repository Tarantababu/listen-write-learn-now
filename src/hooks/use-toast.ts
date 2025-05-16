
// Re-export the toast from sonner for direct usage
import { toast as sonnerToast, type ToastT } from "sonner";

// Create a compatibility layer between Shadcn's toast API and Sonner's API
type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
};

// Helper function to handle different call signatures
function handleToastArgs(args: unknown): { message: string; options?: any } {
  // If it's a string, use it directly as a message
  if (typeof args === 'string') {
    return { message: args };
  }
  
  // If it's a ToastProps object, extract title and description
  if (typeof args === 'object' && args !== null) {
    const props = args as ToastProps;
    return {
      message: props.title || '',
      options: {
        description: props.description,
        duration: props.duration || 3000
      }
    };
  }
  
  return { message: 'Notification' };
}

// Create a wrapper function that maps Shadcn toast params to Sonner
const toast = (props: ToastProps | string, options?: any) => {
  // Handle both the new format and legacy format
  const { message, options: extractedOptions } = handleToastArgs(props);
  const finalOptions = options || extractedOptions || {};
  
  // Map variants to Sonner's style prop
  if (typeof props === 'object' && props !== null) {
    const variant = (props as ToastProps).variant;
    switch (variant) {
      case 'destructive':
        return sonnerToast.error(message, finalOptions);
      case 'success':
        return sonnerToast.success(message, finalOptions);
      case 'warning':
        return sonnerToast(message, { ...finalOptions, className: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-300' });
      default:
        return sonnerToast(message, finalOptions);
    }
  }
  
  // Handle string input
  return sonnerToast(message, finalOptions);
};

// Export the toast function
export { toast };

// Re-export useToast for backward compatibility
export const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    // For backward compatibility with components using the old API
    toasts: []
  };
};
