
import { useToast as useToastHook } from "@/hooks/use-toast";
import { toast as toastFunction } from "@/hooks/use-toast";

// Export the toast components
export const useToast = useToastHook;
export const toast = toastFunction;

// Export toast types for easier usage
export type { ToastProps, ToastActionElement } from "@/hooks/use-toast";

