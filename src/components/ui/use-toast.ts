
// Simply re-export from the hooks file
import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };

// Ensure the toast.toasts property is accessible
if (!toast.toasts) {
  toast.toasts = [];
}
