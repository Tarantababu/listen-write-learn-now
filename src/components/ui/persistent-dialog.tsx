
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePersistentState, useSyncedTabs } from "@/hooks/use-persistent-state";

export interface PersistentDialogProps extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>, "open" | "onOpenChange"> {
  /**
   * Unique identifier for this dialog across tabs
   */
  persistenceKey: string;
  
  /**
   * Initial open state
   */
  initialOpen?: boolean;
  
  /**
   * Duration to remember state (in milliseconds)
   * Default: 1 hour
   */
  persistenceTtl?: number;
  
  /**
   * Whether to sync this dialog's open state across tabs
   */
  syncAcrossTabs?: boolean;
  
  /**
   * Custom onChange handler
   */
  onOpenChange?: (open: boolean) => void;
  
  /**
   * Custom onClose handler
   * Will be called when dialog is closed for any reason
   */
  onClose?: () => void;
  
  /**
   * Children to render inside the dialog
   */
  children: React.ReactNode;
}

/**
 * A Dialog component that persists its open state across tab switches
 * and optionally synchronizes across multiple tabs
 */
export function PersistentDialog({
  persistenceKey,
  initialOpen = false,
  persistenceTtl = 60 * 60 * 1000, // 1 hour by default
  syncAcrossTabs = false,
  onOpenChange,
  onClose,
  children,
  ...props
}: PersistentDialogProps) {
  const uniqueKey = `dialog_${persistenceKey}`;
  const [open, setOpen] = usePersistentState(uniqueKey, initialOpen, persistenceTtl);
  
  // Optionally sync across tabs
  if (syncAcrossTabs) {
    useSyncedTabs(uniqueKey, open, setOpen);
  }
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    
    if (!newOpen && onClose) {
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange} {...props}>
      {children}
    </Dialog>
  );
}

/**
 * Re-export DialogContent and other dialog components
 * to make the API consistent with the regular Dialog
 */
export { DialogContent };
export { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
