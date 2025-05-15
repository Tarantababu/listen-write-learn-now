
import { useToast as useToastOriginal } from "@/components/ui/use-toast";

// Export the toast function directly from the useToast hook
export { toast } from "@/components/ui/use-toast";

// Re-export the useToast hook to maintain compatibility
export const useToast = useToastOriginal;

// Add a helper for showing a refresh message
export const showRefreshMessage = (message: string) => {
  const { toast } = useToastOriginal();
  toast({
    title: "Data refreshed",
    description: message,
  });
};
