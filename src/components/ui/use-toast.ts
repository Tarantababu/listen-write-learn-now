
// We're importing the useToast and toast from the hooks directory
import { useToast, toast } from "@/hooks/use-toast";

// Add the toasts property to make it compatible with the Toaster component
toast.toasts = toast.toasts || [];

export { useToast, toast };
