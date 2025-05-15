
// Simply re-export from the hooks file
import { useToast, toast, showRefreshMessage } from "@/hooks/use-toast";

export { useToast, toast, showRefreshMessage };

// Ensure the toast.toasts property is accessible
if (!toast.toasts) {
  toast.toasts = [];
}
