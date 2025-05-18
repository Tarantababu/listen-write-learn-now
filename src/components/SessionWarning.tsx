
import React, { useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/use-session';
import { Clock } from 'lucide-react';

interface SessionWarningProps {
  timeout?: number; // Session timeout in milliseconds
  warningTime?: number; // Show warning this many ms before timeout
  disableAutoRedirect?: boolean; // Disable automatic redirect to login on session timeout
}

const SessionWarning: React.FC<SessionWarningProps> = ({ 
  timeout = 30 * 60 * 1000, // 30 minutes default
  warningTime = 2 * 60 * 1000, // 2 minutes warning default
  disableAutoRedirect = false // Default to allow redirects after timeout
}) => {
  const { showWarning, timeLeftFormatted, extendSession } = useSession({
    timeout,
    warningTime,
    disableAutoRedirect // Pass the disableAutoRedirect option to useSession
  });

  // Special handling for dialogs - check if any persistent dialog is open
  const [hasActiveDialog, setHasActiveDialog] = React.useState(false);
  
  useEffect(() => {
    // Check for active dialogs periodically
    const checkForActiveDialogs = () => {
      try {
        // Look for any dialog state in localStorage
        const keys = Object.keys(localStorage);
        const dialogKeys = keys.filter(key => 
          key.startsWith('persistent_state_dialog_') || 
          key.startsWith('persistent_state_practice_modal_')
        );
        
        for (const key of dialogKeys) {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          // If dialog is open and not expired
          if (item.value === true && item.expiry > Date.now()) {
            setHasActiveDialog(true);
            return;
          }
        }
        
        setHasActiveDialog(false);
      } catch (e) {
        console.error('Error checking for active dialogs:', e);
      }
    };
    
    // Check immediately and then every 15 seconds
    checkForActiveDialogs();
    const interval = setInterval(checkForActiveDialogs, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  // If active dialog, don't show warning
  const shouldShowWarning = showWarning && !hasActiveDialog;
  
  // Don't render anything if warning not shown
  if (!shouldShowWarning) return null;
  
  return (
    <AlertDialog open={shouldShowWarning} onOpenChange={(open) => {
      if (!open) extendSession();
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" /> 
            Session About to Expire
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in <span className="font-bold">{timeLeftFormatted}</span> due to inactivity.
            <br /><br />
            Would you like to continue your session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={extendSession} className="w-full">
            Continue Session
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionWarning;
