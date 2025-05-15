
// Import from the original hooks file
import { useToast as useToastOriginal, toast as toastOriginal } from "@/hooks/use-toast";

// Re-export with different names to avoid circular references
export const useToast = useToastOriginal;
export const toast = toastOriginal;

// Add the toasts property if it doesn't exist
if (!toast.toasts) {
  toast.toasts = [];
}
