
import { useToast, toast } from "@/hooks/use-toast";

// Add the toasts property if it doesn't exist
if (!toast.toasts) {
  toast.toasts = [];
}

export { useToast, toast };
