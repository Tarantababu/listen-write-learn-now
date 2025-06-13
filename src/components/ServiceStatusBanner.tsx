
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ServiceError {
  type: 'supabase' | 'network' | 'auth' | 'general';
  message: string;
  timestamp: number;
}

export const ServiceStatusBanner: React.FC = () => {
  const [serviceError, setServiceError] = useState<ServiceError | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setServiceError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setServiceError({
        type: 'network',
        message: 'You\'re currently offline. Some features may not work until your connection is restored.',
        timestamp: Date.now()
      });
    };

    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const message = error?.message?.toLowerCase() || '';

      if (message.includes('supabase') || message.includes('database')) {
        setServiceError({
          type: 'supabase',
          message: 'We\'re currently experiencing issues with our database provider. Your data is safe and we\'re working on it.',
          timestamp: Date.now()
        });
      } else if (message.includes('network') || message.includes('fetch')) {
        setServiceError({
          type: 'network',
          message: 'A third-party system is temporarily unavailable. We\'re resolving it.',
          timestamp: Date.now()
        });
      } else if (message.includes('auth') || message.includes('unauthorized')) {
        setServiceError({
          type: 'auth',
          message: 'We\'re unable to connect to our authentication service provider. We\'re on it — everything will be restored soon.',
          timestamp: Date.now()
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const message = error?.message?.toLowerCase() || '';

      if (message.includes('supabase') || message.includes('connection') || message.includes('timeout')) {
        setServiceError({
          type: 'supabase',
          message: 'We\'re currently experiencing issues with a third-party service provider. We\'re working on it — nothing will be lost, and we\'ll be back shortly.',
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Wait a moment then reload
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.reload();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    setServiceError(null);
  };

  const getBannerVariant = (type: string) => {
    switch (type) {
      case 'supabase':
      case 'auth':
        return 'destructive';
      case 'network':
        return 'default';
      default:
        return 'default';
    }
  };

  const getBannerIcon = (type: string) => {
    switch (type) {
      case 'network':
        return isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!serviceError && isOnline) {
    return null;
  }

  const currentError = serviceError || {
    type: 'network' as const,
    message: 'You\'re currently offline. Some features may not work until your connection is restored.',
    timestamp: Date.now()
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Alert variant={getBannerVariant(currentError.type)} className="border-2 shadow-lg">
        <div className="flex items-start space-x-3">
          {getBannerIcon(currentError.type)}
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-sm">
              {currentError.message}
            </AlertDescription>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
                className="h-8 text-xs"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </>
                )}
              </Button>
              <Button
                onClick={() => window.open('mailto:support@lwlnow.com', '_blank')}
                size="sm"
                variant="outline"
                className="h-8 text-xs"
              >
                Contact Support
              </Button>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
};
