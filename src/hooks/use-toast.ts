
import { useToast as useToastHook } from "@/components/ui/use-toast";
import { toast as toastFunction } from "@/components/ui/use-toast";

export const useToast = useToastHook;
export const toast = toastFunction;

export default { useToast, toast };
