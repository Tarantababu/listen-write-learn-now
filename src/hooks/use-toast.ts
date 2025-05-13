
// This file serves as a wrapper for shadcn's toast component
import { useToast as useToastOriginal, toast as toastOriginal } from "@/components/ui/toast";

export const useToast = useToastOriginal;
export const toast = toastOriginal;

