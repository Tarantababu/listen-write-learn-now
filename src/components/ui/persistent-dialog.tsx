import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { savePopupState, getPopupState } from "@/utils/popupStateManager";

// Extend the DialogPrimitive.DialogProps type to include dialogId
interface PersistentDialogProps extends DialogPrimitive.DialogProps {
  dialogId: string; // Unique id for tracking dialog state
}

// Define the type for the popup state
interface PopupState {
  isOpen: boolean;
}

const PersistentDialog = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  PersistentDialogProps
>(({ dialogId, children, open, onOpenChange, ...props }, ref) => {
  // Convert ref to useRef to track state
  const dialogRef = React.useRef<HTMLDivElement>(null);
  
  // Effect to save dialog state when it changes
  React.useEffect(() => {
    if (open !== undefined) {
      savePopupState(dialogId, { isOpen: open });
    }
  }, [open, dialogId]);
  
  // Load state on initial render with proper typing
  const initialState = React.useMemo(() => {
    return getPopupState<PopupState>(dialogId, { isOpen: false });
  }, [dialogId]);
  
  return (
    <DialogPrimitive.Root
      open={open !== undefined ? open : initialState.isOpen}
      onOpenChange={(newOpen) => {
        savePopupState(dialogId, { isOpen: newOpen });
        if (onOpenChange) {
          onOpenChange(newOpen);
        }
      }}
      {...props}
    >
      {children}
    </DialogPrimitive.Root>
  );
});
PersistentDialog.displayName = "PersistentDialog";

const PersistentDialogTrigger = DialogPrimitive.Trigger;

const PersistentDialogPortal = DialogPrimitive.Portal;

const PersistentDialogClose = DialogPrimitive.Close;

const PersistentDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
PersistentDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const PersistentDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <PersistentDialogPortal>
    <PersistentDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <PersistentDialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </PersistentDialogClose>
    </DialogPrimitive.Content>
  </PersistentDialogPortal>
));
PersistentDialogContent.displayName = DialogPrimitive.Content.displayName;

const PersistentDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
PersistentDialogHeader.displayName = "PersistentDialogHeader";

const PersistentDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
PersistentDialogFooter.displayName = "PersistentDialogFooter";

const PersistentDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
PersistentDialogTitle.displayName = DialogPrimitive.Title.displayName;

const PersistentDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
PersistentDialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  PersistentDialog,
  PersistentDialogPortal,
  PersistentDialogOverlay,
  PersistentDialogClose,
  PersistentDialogTrigger,
  PersistentDialogContent,
  PersistentDialogHeader,
  PersistentDialogFooter,
  PersistentDialogTitle,
  PersistentDialogDescription,
};
