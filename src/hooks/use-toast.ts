
// Re-export the toast from sonner for direct usage
import { toast as sonnerToast } from "sonner";

// Create a compatibility layer between Shadcn's toast API and Sonner's API
type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
};

// Create a wrapper function that maps Shadcn toast params to Sonner
const toast = (props: ToastProps | string) => {
  // If it's a string, treat it as a simple message
  if (typeof props === 'string') {
    return sonnerToast(props);
  }

  const { title, description, variant, duration } = props;
  
  // Map variants to Sonner's style prop
  switch (variant) {
    case 'destructive':
      return sonnerToast.error(title, {
        description,
        duration
      });
    case 'success':
      return sonnerToast.success(title, {
        description,
        duration
      });
    default:
      return sonnerToast(title, {
        description,
        duration
      });
  }
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
