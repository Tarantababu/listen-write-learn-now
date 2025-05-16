
import { toast } from "sonner";

export { toast };

// Re-export useToast for backward compatibility
export const useToast = () => {
  return {
    toast,
    dismiss: toast.dismiss,
    // For backward compatibility with components using the old API
    toasts: []
  };
};
