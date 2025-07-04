import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGTM } from '@/hooks/use-gtm';
import { usePostHog } from '@/hooks/use-posthog';

interface GTMTrackerProps {
  children?: React.ReactNode;
}

export const GTMTracker: React.FC<GTMTrackerProps> = ({ children }) => {
  const location = useLocation();
  const { trackPageView } = useGTM();
  const { capturePageView } = usePostHog();

  // Track page views on route changes
  useEffect(() => {
    const pageTitle = document.title || 'Unknown Page';
    
    // Track in GTM
    trackPageView(pageTitle, {
      page_path: location.pathname,
      page_search: location.search,
      page_hash: location.hash
    });

    // Track in PostHog
    capturePageView(pageTitle, {
      page_path: location.pathname,
      page_search: location.search,
      page_hash: location.hash
    });
  }, [location, trackPageView, capturePageView]);

  return <>{children}</>;
};

// HOC for wrapping components with GTM tracking
export const withGTMTracking = <P extends object>(
  Component: React.ComponentType<P>,
  trackingData?: Record<string, any>
) => {
  const WrappedComponent = (props: P) => {
    const { gtmService } = useGTM();

    useEffect(() => {
      if (trackingData) {
        gtmService.push({
          event: 'component_viewed',
          component_name: Component.displayName || Component.name,
          ...trackingData
        });
      }
    }, []);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withGTMTracking(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
