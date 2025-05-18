
import React from 'react';
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
  
  // Don't render anything if warning not shown
  if (!showWarning) return null;
  
  return (
    <AlertDialog open={showWarning} onOpenChange={(open) => {
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
