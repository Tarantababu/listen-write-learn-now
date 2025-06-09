
import { useCallback } from 'react';
import { gtmService, CTAClickEvent, FeatureUsedEvent } from '@/services/gtmService';

export const useGTM = () => {
  const trackCTAClick = useCallback((data: Omit<CTAClickEvent, 'event'>) => {
    gtmService.trackCTAClick(data);
  }, []);

  const trackFeatureUsed = useCallback((data: Omit<FeatureUsedEvent, 'event'>) => {
    gtmService.trackFeatureUsed(data);
  }, []);

  const trackPageView = useCallback((pageTitle: string, additionalData?: Record<string, any>) => {
    gtmService.trackPageView({
      page_title: pageTitle,
      page_location: window.location.href,
      ...additionalData
    });
  }, []);

  // Helper for tracking CTA clicks with location context
  const trackCTAWithLocation = useCallback((
    ctaType: CTAClickEvent['cta_type'],
    ctaText?: string,
    additionalData?: Record<string, any>
  ) => {
    trackCTAClick({
      cta_type: ctaType,
      cta_location: window.location.pathname,
      cta_text: ctaText,
      ...additionalData
    });
  }, [trackCTAClick]);

  // Helper for adding GTM data attributes to refs
  const addGTMAttributes = useCallback((element: HTMLElement | null, attributes: Record<string, string>) => {
    if (element) {
      gtmService.addDataAttributes(element, attributes);
    }
  }, []);

  return {
    trackCTAClick,
    trackFeatureUsed,
    trackPageView,
    trackCTAWithLocation,
    addGTMAttributes,
    gtmService
  };
};
