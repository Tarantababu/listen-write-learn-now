
import { useCallback } from 'react';
import { posthogService, PostHogCTAClickEvent, PostHogFeatureUsedEvent } from '@/services/posthogService';

export const usePostHog = () => {
  const trackCTAClick = useCallback((data: PostHogCTAClickEvent) => {
    posthogService.trackCTAClick(data);
  }, []);

  const trackFeatureUsed = useCallback((data: PostHogFeatureUsedEvent) => {
    posthogService.trackFeatureUsed(data);
  }, []);

  const trackPageView = useCallback((pageTitle: string, additionalData?: Record<string, any>) => {
    posthogService.trackPageView({
      page_title: pageTitle,
      page_location: window.location.href,
      ...additionalData
    });
  }, []);

  const capture = useCallback((eventName: string, properties?: Record<string, any>) => {
    posthogService.capture(eventName, properties);
  }, []);

  // Helper for tracking CTA clicks with location context
  const trackCTAWithLocation = useCallback((
    ctaType: PostHogCTAClickEvent['cta_type'],
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

  const setPersonProperties = useCallback((properties: Record<string, any>) => {
    posthogService.setPersonProperties(properties);
  }, []);

  const getFeatureFlag = useCallback((flagName: string) => {
    return posthogService.getFeatureFlag(flagName);
  }, []);

  const isFeatureEnabled = useCallback((flagName: string) => {
    return posthogService.isFeatureEnabled(flagName);
  }, []);

  return {
    trackCTAClick,
    trackFeatureUsed,
    trackPageView,
    capture,
    trackCTAWithLocation,
    setPersonProperties,
    getFeatureFlag,
    isFeatureEnabled,
    posthogService
  };
};
