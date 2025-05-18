import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [sessionActive, setSessionActive] = useState<boolean>(true);
  
  // Use refs to access the latest state in event handlers
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tabActiveRef = useRef<boolean>(true);
  
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
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      
      // Set new timeouts
      const newWarningTimeout = setTimeout(() => {
        setShowWarning(true);
      }, timeout - warningTime);
      
      const newSessionTimeout = setTimeout(() => {
        handleSessionTimeout();
      }, timeout);
      
      warningTimeoutRef.current = newWarningTimeout;
      sessionTimeoutRef.current = newSessionTimeout;
    }
  }, [lastActivity, showWarning, timeout, warningTime, sessionActive]);

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

  // Pause timers when tab is not visible
  const handleVisibilityChange = useCallback(() => {
    const isTabVisible = document.visibilityState === 'visible';
    tabActiveRef.current = isTabVisible;
    
    if (isTabVisible) {
      // When tab becomes visible again, we don't immediately trigger activity
      // This prevents unwanted resets when user quickly switches tabs
      // Instead, we'll wait for actual user interaction to trigger recordActivity
      console.log('Tab is now visible - waiting for user interaction');
    } else {
      // When tab becomes hidden, we pause the timers by clearing them
      console.log('Tab hidden - pausing session timers');
      
      // Save the remaining time before clearing timeouts
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
    }
  }, []);

  // Keep track of time left during warning period
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (showWarning) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const sessionExpiry = lastActivity + timeout;
        const remaining = Math.max(0, sessionExpiry - now);
        
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [showWarning, lastActivity, timeout]);

  // Set up user activity tracking and visibility change detection
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
      if (!tabActiveRef.current) {
        // Tab just became active through user interaction
        tabActiveRef.current = true;
        console.log('User interaction detected after tab switch');
      }
      
      const now = Date.now();
      if (now - lastRecordTime > 10000) { // Only record every 10 seconds max
        recordActivity();
        lastRecordTime = now;
      }
    };
    
    // Register activity event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    // Register visibility change event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set initial timeouts
    const initialWarningTimeout = setTimeout(() => {
      setShowWarning(true);
    }, timeout - warningTime);
    
    const initialSessionTimeout = setTimeout(() => {
      handleSessionTimeout();
    }, timeout);
    
    warningTimeoutRef.current = initialWarningTimeout;
    sessionTimeoutRef.current = initialSessionTimeout;
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, recordActivity, handleSessionTimeout, handleVisibilityChange, timeout, warningTime]);

  // Format time left as mm:ss
  const formatTimeLeft = (ms: number | null): string => {
    if (ms === null) return '';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Extend session manually
  const extendSession = useCallback(() => {
    setSessionActive(true);
    recordActivity();
  }, [recordActivity]);

  // Manually end session
  const endSession = useCallback(() => {
    setSessionActive(false);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
  }, []);

  return {
    showWarning,
    timeLeftFormatted: formatTimeLeft(timeLeft),
    timeLeftMs: timeLeft,
    extendSession,
    endSession,
    sessionActive
  };
}
