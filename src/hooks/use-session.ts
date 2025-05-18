
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

/**
 * Hook for managing user session timeouts and activity tracking
 * Now with support for handling tab visibility changes and dialog focus
 */
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
  const dialogActiveRef = useRef<boolean>(false); // Track if a dialog is currently active
  
  // Check if any persistent dialog is active
  useEffect(() => {
    const checkForActiveDialogs = () => {
      // Check if any localStorage keys indicate an active dialog
      const keys = Object.keys(localStorage);
      const dialogKeys = keys.filter(key => key.startsWith('persistent_state_dialog_'));
      
      for (const key of dialogKeys) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          // If we find an open dialog and it's not expired
          if (item.value === true && item.expiry > Date.now()) {
            return true;
          }
        } catch (e) {
          console.error('Error parsing localStorage item:', e);
        }
      }
      
      return false;
    };
    
    // Initial check
    dialogActiveRef.current = checkForActiveDialogs();
    
    // Set up interval to periodically check for active dialogs
    const checkInterval = setInterval(() => {
      dialogActiveRef.current = checkForActiveDialogs();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(checkInterval);
  }, []);
  
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
        // Don't show warning if a dialog is active
        if (!dialogActiveRef.current) {
          setShowWarning(true);
        }
      }, timeout - warningTime);
      
      const newSessionTimeout = setTimeout(() => {
        // Don't timeout if a dialog is active
        if (!dialogActiveRef.current) {
          handleSessionTimeout();
        } else {
          // If dialog is active, extend the session instead
          recordActivity();
        }
      }, timeout);
      
      warningTimeoutRef.current = newWarningTimeout;
      sessionTimeoutRef.current = newSessionTimeout;
    }
  }, [lastActivity, showWarning, timeout, warningTime, sessionActive]);

  // Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    // If a dialog is active, don't timeout the session
    if (dialogActiveRef.current) {
      recordActivity();
      return;
    }
    
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
  }, [onTimeout, navigate, signOut, disableAutoRedirect, recordActivity]);

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
      // Only show warning if no dialog is active
      if (!dialogActiveRef.current) {
        setShowWarning(true);
      }
    }, timeout - warningTime);
    
    const initialSessionTimeout = setTimeout(() => {
      // Only timeout if no dialog is active
      if (!dialogActiveRef.current) {
        handleSessionTimeout();
      } else {
        // If dialog is active, extend the session instead
        recordActivity();
      }
    }, timeout);
    
    warningTimeoutRef.current = initialWarningTimeout;
    sessionTimeoutRef.current = initialSessionTimeout;
    
    // Check for storage events that might indicate dialog state changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('persistent_state_dialog_')) {
        try {
          if (e.newValue) {
            const item = JSON.parse(e.newValue);
            // If a dialog was opened
            if (item.value === true) {
              dialogActiveRef.current = true;
              // Extend session when dialog opens
              recordActivity();
            } else {
              // Need to check all dialogs
              const keys = Object.keys(localStorage);
              const dialogKeys = keys.filter(key => key.startsWith('persistent_state_dialog_'));
              dialogActiveRef.current = dialogKeys.some(key => {
                try {
                  const item = JSON.parse(localStorage.getItem(key) || '{}');
                  return item.value === true && item.expiry > Date.now();
                } catch {
                  return false;
                }
              });
            }
          }
        } catch (error) {
          console.error('Error handling storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      
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
