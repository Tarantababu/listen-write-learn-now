
import { User } from '@supabase/supabase-js';

// PostHog Event Types
export interface PostHogEvent {
  event: string;
  properties?: Record<string, any>;
}

export interface PostHogUserProperties {
  email?: string;
  user_id?: string;
  created_at?: string;
  is_premium?: boolean;
  learning_languages?: string[];
  selected_language?: string;
}

// Main PostHog Service Class
class PostHogService {
  private isInitialized: boolean = false;

  // Initialize PostHog (it's already initialized via script, but we can configure further)
  initialize() {
    if (this.isInitialized || typeof window === 'undefined' || !window.posthog) return;
    
    this.isInitialized = true;
    console.log('PostHog Service initialized');
  }

  // Check if PostHog is available
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.posthog;
  }

  // Identify user for PostHog
  identify(userId: string, properties?: PostHogUserProperties) {
    if (!this.isAvailable()) return;
    
    window.posthog.identify(userId, properties);
    console.log('PostHog user identified:', userId, properties);
  }

  // Track custom events
  capture(event: string, properties?: Record<string, any>) {
    if (!this.isAvailable()) return;
    
    window.posthog.capture(event, properties);
    console.log('PostHog event captured:', event, properties);
  }

  // Track page views
  capturePageView(pageName: string, properties?: Record<string, any>) {
    this.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName,
      ...properties
    });
  }

  // Track user login
  trackLogin(method: string, isNewUser: boolean = false) {
    this.capture('user_login', {
      login_method: method,
      is_new_user: isNewUser
    });
  }

  // Track user logout
  trackLogout() {
    this.capture('user_logout');
  }

  // Track feature usage
  trackFeature(featureName: string, properties?: Record<string, any>) {
    this.capture('feature_used', {
      feature_name: featureName,
      ...properties
    });
  }

  // Track CTA clicks
  trackCTAClick(ctaType: string, location: string, text?: string) {
    this.capture('cta_click', {
      cta_type: ctaType,
      cta_location: location,
      cta_text: text
    });
  }

  // Get feature flag value
  getFeatureFlag(flagKey: string): boolean | string | undefined {
    if (!this.isAvailable()) return undefined;
    
    return window.posthog.getFeatureFlag(flagKey);
  }

  // Check if feature is enabled
  isFeatureEnabled(flagKey: string): boolean {
    if (!this.isAvailable()) return false;
    
    return window.posthog.isFeatureEnabled(flagKey);
  }

  // Set user properties
  setUserProperties(properties: PostHogUserProperties) {
    if (!this.isAvailable()) return;
    
    window.posthog.setPersonProperties(properties);
  }

  // Reset user (on logout)
  reset() {
    if (!this.isAvailable()) return;
    
    window.posthog.reset();
  }
}

// Create singleton instance
export const posthogService = new PostHogService();

// Type declarations for window.posthog
declare global {
  interface Window {
    posthog: any;
  }
}

