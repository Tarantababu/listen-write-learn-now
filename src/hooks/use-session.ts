
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Default session timeout in milliseconds (30 minutes)
const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000;
// Warning before session timeout (2 minutes before)
const WARNING_BEFORE_TIMEOUT = 2 * 60 * 1000;
// Activity reset threshold (user needs to be inactive for this long to trigger a check)
const ACTIVITY_RESET_THRESHOLD = 5 * 60 * 1000;

interface UseSessionOptions {
  timeout?: number;        // Session timeout in milliseconds
  warningTime?: number;    // Show warning this many ms before timeout
  onTimeout?: () => void;  // Custom timeout handler
  disableAutoRedirect?: boolean; // Disable automatic redirect to login
}

export function useSession(options: UseSessionOptions = {}) {
  const {
    timeout = DEFAULT_SESSION_TIMEOUT,
    warningTime = WARNING_BEFORE_TIMEOUT,
    onTimeout,
    disableAutoRedirect = false
  } = options;

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [warningTimeout, setWarningTimeout] = useState<NodeJS.Timeout | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [sessionActive, setSessionActive] = useState<boolean>(true);

  // Reset timers and record new activity
  const recordActivity = useCallback(() => {
    if (!sessionActive) return; // Skip if session is intentionally ended
    
    const now = Date.now();
    
    // Only update if a significant amount of time has passed (prevents constant resets)
    // Or if warning is currently showing (to dismiss it)
    if (now - lastActivity > ACTIVITY_RESET_THRESHOLD || showWarning) {
      setLastActivity(now);
      setShowWarning(false);
      setTimeLeft(null);
      
      // Clear existing timeouts
      if (warningTimeout) clearTimeout(warningTimeout);
      if (sessionTimeout) clearTimeout(sessionTimeout);
      
      // Set new timeouts
      const newWarningTimeout = setTimeout(() => {
        setShowWarning(true);
      }, timeout - warningTime);
      
      const newSessionTimeout = setTimeout(() => {
        handleSessionTimeout();
      }, timeout);
      
      setWarningTimeout(newWarningTimeout);
      setSessionTimeout(newSessionTimeout);
    }
  }, [lastActivity, showWarning, warningTimeout, sessionTimeout, timeout, warningTime, sessionActive]);

  // Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    setSessionActive(false);
    
    if (onTimeout) {
      onTimeout();
    }
    
    if (!disableAutoRedirect) {
      toast({
        title: "Session Expired",
        description: "Your session has expired due to inactivity. Please log in again.",
        variant: "destructive",
      });
      
      // Log user out and redirect to login
      signOut();
      navigate('/login', { replace: true });
    }
  }, [onTimeout, navigate, signOut, disableAutoRedirect]);

  // Keep track of time left during warning period
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (showWarning) {
      interval = setInterval(() => {
        const now = Date.now();
        const sessionExpiry = lastActivity + timeout;
        const remaining = Math.max(0, sessionExpiry - now);
        
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          if (interval) clearInterval(interval);
        }
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWarning, lastActivity, timeout]);

  // Set up user activity tracking
  useEffect(() => {
    if (!user) return;
    
    // Initialize with current time
    setLastActivity(Date.now());
    setSessionActive(true);
    
    // Add event listeners for user activity
    const activityEvents = [
      'mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'
    ];
    
    // Throttled event handler - we don't need to record every tiny movement
    let lastRecordTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRecordTime > 10000) { // Only record every 10 seconds max
        recordActivity();
        lastRecordTime = now;
      }
    };
    
    // Register event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    // Set initial timeouts
    const initialWarningTimeout = setTimeout(() => {
      setShowWarning(true);
    }, timeout - warningTime);
    
    const initialSessionTimeout = setTimeout(() => {
      handleSessionTimeout();
    }, timeout);
    
    setWarningTimeout(initialWarningTimeout);
    setSessionTimeout(initialSessionTimeout);
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (warningTimeout) clearTimeout(warningTimeout);
      if (sessionTimeout) clearTimeout(sessionTimeout);
    };
  }, [user, recordActivity, handleSessionTimeout, timeout, warningTime]);

  // Format time left as mm:ss
  const formatTimeLeft = (ms: number | null): string => {
    if (ms === null) return '';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Extend session manually
  const extendSession = () => {
    setSessionActive(true);
    recordActivity();
  };

  // Manually end session
  const endSession = () => {
    setSessionActive(false);
    if (warningTimeout) clearTimeout(warningTimeout);
    if (sessionTimeout) clearTimeout(sessionTimeout);
  };

  return {
    showWarning,
    timeLeftFormatted: formatTimeLeft(timeLeft),
    timeLeftMs: timeLeft,
    extendSession,
    endSession,
    sessionActive
  };
}
