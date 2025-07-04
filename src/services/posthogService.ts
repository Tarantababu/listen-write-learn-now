
import { User } from '@supabase/supabase-js';

// PostHog Event Types
export interface PostHogEvent {
  [key: string]: any;
}

export interface PostHogCTAClickEvent extends PostHogEvent {
  cta_type: 'signup' | 'login' | 'upgrade' | 'start_exercise' | 'contact' | 'other';
  cta_location: string;
  cta_text?: string;
  user_authenticated?: boolean;
  page_url?: string;
}

export interface PostHogFeatureUsedEvent extends PostHogEvent {
  feature_name: string;
  feature_category: 'exercise' | 'vocabulary' | 'settings' | 'admin' | 'other';
  user_id?: string;
  additional_data?: Record<string, any>;
}

export interface PostHogUserLoginEvent extends PostHogEvent {
  login_method: 'email' | 'google' | 'other';
  user_id: string;
  is_new_user: boolean;
}

export interface PostHogPageViewEvent extends PostHogEvent {
  page_title: string;
  page_location: string;
  user_id?: string;
  user_authenticated: boolean;
}

// Main PostHog Service Class
class PostHogService {
  private isInitialized: boolean = false;
  private currentUserId: string | null = null;

  // Initialize PostHog
  initialize() {
    if (this.isInitialized) return;

    if (typeof window !== 'undefined' && window.posthog) {
      this.isInitialized = true;
      console.log('PostHog Service initialized');
    }
  }

  // Generate GDPR-compliant hashed user ID
  private generateHashedUserId(user: User): string {
    const rawString = user.id + 'lwlnow_posthog_salt_2024';
    
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      const char = rawString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `user_${Math.abs(hash).toString(36)}`;
  }

  // Set user data in PostHog
  setUser(user: User | null) {
    if (!this.isInitialized) this.initialize();

    if (typeof window === 'undefined' || !window.posthog) return;

    if (user) {
      this.currentUserId = this.generateHashedUserId(user);
      
      // Identify user in PostHog
      window.posthog.identify(this.currentUserId, {
        userAuthenticated: true,
        userCreatedAt: user.created_at,
        hasProfile: !!user.user_metadata,
        emailVerified: !!user.email_confirmed_at
      });
    } else {
      this.currentUserId = null;
      window.posthog.reset();
    }
  }

  // Generic capture method
  capture(eventName: string, properties?: PostHogEvent) {
    if (!this.isInitialized) this.initialize();

    if (typeof window !== 'undefined' && window.posthog) {
      const eventData = {
        ...properties,
        timestamp: new Date().toISOString(),
        ...(this.currentUserId && { userId: this.currentUserId })
      };

      window.posthog.capture(eventName, eventData);
      console.log('PostHog Event captured:', eventName, eventData);
    }
  }

  // Specific event tracking methods
  trackCTAClick(data: PostHogCTAClickEvent) {
    this.capture('cta_click', {
      ...data,
      page_url: window.location.href,
      user_authenticated: !!this.currentUserId
    });
  }

  trackFeatureUsed(data: PostHogFeatureUsedEvent) {
    this.capture('feature_used', {
      ...data,
      user_id: this.currentUserId
    });
  }

  trackUserLogin(data: Omit<PostHogUserLoginEvent, 'user_id'>, user: User) {
    const hashedUserId = this.generateHashedUserId(user);
    this.capture('user_login', {
      ...data,
      user_id: hashedUserId
    });
  }

  trackUserLogout() {
    this.capture('user_logout', {
      user_id: this.currentUserId
    });
  }

  trackPageView(data: Omit<PostHogPageViewEvent, 'user_id' | 'user_authenticated'>) {
    this.capture('page_view', {
      ...data,
      user_id: this.currentUserId,
      user_authenticated: !!this.currentUserId
    });
  }

  // Set user properties
  setPersonProperties(properties: Record<string, any>) {
    if (!this.isInitialized) this.initialize();

    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.setPersonProperties(properties);
    }
  }

  // Get feature flags
  getFeatureFlag(flagName: string): boolean | string | undefined {
    if (!this.isInitialized) this.initialize();

    if (typeof window !== 'undefined' && window.posthog) {
      return window.posthog.getFeatureFlag(flagName);
    }
    return undefined;
  }

  // Check if feature is enabled
  isFeatureEnabled(flagName: string): boolean {
    if (!this.isInitialized) this.initialize();

    if (typeof window !== 'undefined' && window.posthog) {
      return window.posthog.isFeatureEnabled(flagName);
    }
    return false;
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
