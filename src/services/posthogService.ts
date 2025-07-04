
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
  private initializationAttempted: boolean = false;

  // Initialize PostHog with error handling
  initialize() {
    if (this.isInitialized || this.initializationAttempted) return;
    
    this.initializationAttempted = true;

    try {
      if (typeof window !== 'undefined' && window.posthog) {
        // PostHog is already initialized in the HTML, just mark as ready
        this.isInitialized = true;
        console.log('PostHog Service initialized (using existing instance)');
      }
    } catch (error) {
      console.warn('PostHog initialization warning:', error);
      // Don't throw - continue without PostHog rather than breaking the app
    }
  }

  // Safely check if PostHog is available
  private isPostHogAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.posthog && 
           typeof window.posthog.capture === 'function';
  }

  // Generate GDPR-compliant hashed user ID
  private generateHashedUserId(user: User): string {
    try {
      const rawString = user.id + 'lwlnow_posthog_salt_2024';
      
      let hash = 0;
      for (let i = 0; i < rawString.length; i++) {
        const char = rawString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return `user_${Math.abs(hash).toString(36)}`;
    } catch (error) {
      console.warn('Error generating hashed user ID:', error);
      return `user_fallback_${Date.now()}`;
    }
  }

  // Set user data in PostHog with error handling
  setUser(user: User | null) {
    if (!this.isInitialized) this.initialize();

    try {
      if (!this.isPostHogAvailable()) return;

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
    } catch (error) {
      console.warn('PostHog setUser error:', error);
      // Don't throw - continue without PostHog tracking
    }
  }

  // Generic capture method with error handling
  capture(eventName: string, properties?: PostHogEvent) {
    if (!this.isInitialized) this.initialize();

    try {
      if (!this.isPostHogAvailable()) return;

      const eventData = {
        ...properties,
        timestamp: new Date().toISOString(),
        ...(this.currentUserId && { userId: this.currentUserId })
      };

      window.posthog.capture(eventName, eventData);
      console.log('PostHog Event captured:', eventName, eventData);
    } catch (error) {
      console.warn('PostHog capture error:', error);
      // Don't throw - continue without tracking this event
    }
  }

  // Specific event tracking methods
  trackCTAClick(data: PostHogCTAClickEvent) {
    try {
      this.capture('cta_click', {
        ...data,
        page_url: window.location.href,
        user_authenticated: !!this.currentUserId
      });
    } catch (error) {
      console.warn('PostHog trackCTAClick error:', error);
    }
  }

  trackFeatureUsed(data: PostHogFeatureUsedEvent) {
    try {
      this.capture('feature_used', {
        ...data,
        user_id: this.currentUserId
      });
    } catch (error) {
      console.warn('PostHog trackFeatureUsed error:', error);
    }
  }

  trackUserLogin(data: Omit<PostHogUserLoginEvent, 'user_id'>, user: User) {
    try {
      const hashedUserId = this.generateHashedUserId(user);
      this.capture('user_login', {
        ...data,
        user_id: hashedUserId
      });
    } catch (error) {
      console.warn('PostHog trackUserLogin error:', error);
    }
  }

  trackUserLogout() {
    try {
      this.capture('user_logout', {
        user_id: this.currentUserId
      });
    } catch (error) {
      console.warn('PostHog trackUserLogout error:', error);
    }
  }

  trackPageView(data: Omit<PostHogPageViewEvent, 'user_id' | 'user_authenticated'>) {
    try {
      this.capture('page_view', {
        ...data,
        user_id: this.currentUserId,
        user_authenticated: !!this.currentUserId
      });
    } catch (error) {
      console.warn('PostHog trackPageView error:', error);
    }
  }

  // Set user properties with error handling
  setPersonProperties(properties: Record<string, any>) {
    if (!this.isInitialized) this.initialize();

    try {
      if (this.isPostHogAvailable()) {
        window.posthog.setPersonProperties(properties);
      }
    } catch (error) {
      console.warn('PostHog setPersonProperties error:', error);
    }
  }

  // Get feature flags with error handling
  getFeatureFlag(flagName: string): boolean | string | undefined {
    if (!this.isInitialized) this.initialize();

    try {
      if (this.isPostHogAvailable()) {
        return window.posthog.getFeatureFlag(flagName);
      }
    } catch (error) {
      console.warn('PostHog getFeatureFlag error:', error);
    }
    return undefined;
  }

  // Check if feature is enabled with error handling
  isFeatureEnabled(flagName: string): boolean {
    if (!this.isInitialized) this.initialize();

    try {
      if (this.isPostHogAvailable()) {
        return window.posthog.isFeatureEnabled(flagName);
      }
    } catch (error) {
      console.warn('PostHog isFeatureEnabled error:', error);
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
