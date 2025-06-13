
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface ServiceStatus {
  isOnline: boolean;
  hasSupabaseIssue: boolean;
  hasNetworkIssue: boolean;
  hasAuthIssue: boolean;
  lastError: string | null;
  lastErrorTime: number | null;
}

export const useServiceStatus = () => {
  const [status, setStatus] = useState<ServiceStatus>({
    isOnline: navigator.onLine,
    hasSupabaseIssue: false,
    hasNetworkIssue: false,
    hasAuthIssue: false,
    lastError: null,
    lastErrorTime: null
  });

  const updateStatus = useCallback((updates: Partial<ServiceStatus>) => {
    setStatus(prev => ({ ...prev, ...updates }));
  }, []);

  const reportError = useCallback((error: any, context?: string) => {
    const message = error?.message?.toLowerCase() || '';
    const errorCode = error?.status || error?.code;
    
    console.error(`Service error${context ? ` in ${context}` : ''}:`, error);

    // Determine error type and update status
    if (message.includes('supabase') || 
        message.includes('database') || 
        message.includes('postgrest') ||
        errorCode >= 500) {
      updateStatus({
        hasSupabaseIssue: true,
        lastError: 'Database service issue',
        lastErrorTime: Date.now()
      });
      
      toast.error('Database service issue', {
        description: 'We\'re experiencing issues with our database provider. Your data is safe and we\'re working on it.',
        duration: 6000,
        action: {
          label: 'Contact Support',
          onClick: () => window.open('mailto:support@lwlnow.com', '_blank')
        }
      });
    } else if (message.includes('network') || 
               message.includes('fetch') || 
               message.includes('connection') ||
               !navigator.onLine) {
      updateStatus({
        hasNetworkIssue: true,
        lastError: 'Network connection issue',
        lastErrorTime: Date.now()
      });
      
      toast.error('Connection issue', {
        description: 'A third-party system is temporarily unavailable. We\'re resolving it.',
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      });
    } else if (message.includes('auth') || 
               message.includes('unauthorized') ||
               errorCode === 401 || 
               errorCode === 403) {
      updateStatus({
        hasAuthIssue: true,
        lastError: 'Authentication service issue',
        lastErrorTime: Date.now()
      });
      
      toast.error('Authentication issue', {
        description: 'We\'re unable to connect to our authentication service provider. We\'re working on it.',
        duration: 5000,
        action: {
          label: 'Contact Support',
          onClick: () => window.open('mailto:support@lwlnow.com', '_blank')
        }
      });
    } else {
      // Generic error
      updateStatus({
        lastError: 'Service issue detected',
        lastErrorTime: Date.now()
      });
      
      toast.error('Service issue', {
        description: 'We encountered an unexpected issue. Our team has been notified.',
        duration: 4000
      });
    }
  }, [updateStatus]);

  const clearError = useCallback((errorType?: keyof ServiceStatus) => {
    if (errorType) {
      updateStatus({ [errorType]: false });
    } else {
      updateStatus({
        hasSupabaseIssue: false,
        hasNetworkIssue: false,
        hasAuthIssue: false,
        lastError: null,
        lastErrorTime: null
      });
    }
  }, [updateStatus]);

  const checkServiceHealth = useCallback(async () => {
    try {
      // Simple health check - you can replace this with an actual health endpoint
      const response = await fetch('https://kmpghammoxblhacndimq.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcGdoYW1tb3hibGhhY25kaW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MzcyMDUsImV4cCI6MjA2MTQxMzIwNX0.hDTz62yN8XWktfC2edLsgdinKZODP4T-VZfVJKptGao'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        clearError();
        return true;
      } else {
        reportError(new Error(`Health check failed: ${response.status}`), 'health-check');
        return false;
      }
    } catch (error) {
      reportError(error, 'health-check');
      return false;
    }
  }, [clearError, reportError]);

  useEffect(() => {
    const handleOnline = () => {
      updateStatus({ isOnline: true, hasNetworkIssue: false });
      toast.success('Connection restored', {
        description: 'You\'re back online! Services should work normally now.',
        duration: 3000
      });
    };

    const handleOffline = () => {
      updateStatus({ 
        isOnline: false, 
        hasNetworkIssue: true,
        lastError: 'You\'re offline',
        lastErrorTime: Date.now()
      });
      toast.error('You\'re offline', {
        description: 'Some features may not work until your connection is restored.',
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateStatus]);

  return {
    status,
    reportError,
    clearError,
    checkServiceHealth
  };
};
