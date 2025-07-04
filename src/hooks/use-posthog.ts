
import { useCallback, useEffect } from 'react';
import { posthogService, PostHogUserProperties } from '@/services/posthogService';

export const usePostHog = () => {
  // Initialize PostHog service
  useEffect(() => {
    posthogService.initialize();
  }, []);

  const identify = useCallback((userId: string, properties?: PostHogUserProperties) => {
    posthogService.identify(userId, properties);
  }, []);

  const capture = useCallback((event: string, properties?: Record<string, any>) => {
    posthogService.capture(event, properties);
  }, []);

  const capturePageView = useCallback((pageName: string, properties?: Record<string, any>) => {
    posthogService.capturePageView(pageName, properties);
  }, []);

  const trackLogin = useCallback((method: string, isNewUser?: boolean) => {
    posthogService.trackLogin(method, isNewUser);
  }, []);

  const trackLogout = useCallback(() => {
    posthogService.trackLogout();
  }, []);

  const trackFeature = useCallback((featureName: string, properties?: Record<string, any>) => {
    posthogService.trackFeature(featureName, properties);
  }, []);

  const trackCTAClick = useCallback((ctaType: string, location: string, text?: string) => {
    posthogService.trackCTAClick(ctaType, location, text);
  }, []);

  const getFeatureFlag = useCallback((flagKey: string) => {
    return posthogService.getFeatureFlag(flagKey);
  }, []);

  const isFeatureEnabled = useCallback((flagKey: string) => {
    return posthogService.isFeatureEnabled(flagKey);
  }, []);

  const setUserProperties = useCallback((properties: PostHogUserProperties) => {
    posthogService.setUserProperties(properties);
  }, []);

  const reset = useCallback(() => {
    posthogService.reset();
  }, []);

  return {
    identify,
    capture,
    capturePageView,
    trackLogin,
    trackLogout,
    trackFeature,
    trackCTAClick,
    getFeatureFlag,
    isFeatureEnabled,
    setUserProperties,
    reset,
    posthogService
  };
};

