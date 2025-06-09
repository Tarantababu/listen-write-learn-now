
import { User } from '@supabase/supabase-js';

// GTM Event Types
export interface GTMEvent {
  event: string;
  [key: string]: any;
}

export interface CTAClickEvent extends GTMEvent {
  event: 'cta_click';
  cta_type: 'signup' | 'login' | 'upgrade' | 'start_exercise' | 'contact' | 'other';
  cta_location: string;
  cta_text?: string;
  user_authenticated?: boolean;
  page_url?: string;
}

export interface FeatureUsedEvent extends GTMEvent {
  event: 'feature_used';
  feature_name: string;
  feature_category: 'exercise' | 'vocabulary' | 'settings' | 'admin' | 'other';
  user_id?: string;
  additional_data?: Record<string, any>;
}

export interface UserLoginEvent extends GTMEvent {
  event: 'user_login';
  login_method: 'email' | 'google' | 'other';
  user_id: string;
  is_new_user: boolean;
}

export interface UserLogoutEvent extends GTMEvent {
  event: 'user_logout';
  user_id?: string;
}

export interface PageViewEvent extends GTMEvent {
  event: 'page_view';
  page_title: string;
  page_location: string;
  user_id?: string;
  user_authenticated: boolean;
}

export interface UserDataEvent extends GTMEvent {
  event: 'user_data_update';
  userId: string;
  userAuthenticated: boolean;
  userCreatedAt?: string;
  userMetadata?: Record<string, any>;
}

// Main GTM Service Class
class GTMService {
  private isInitialized: boolean = false;
  private currentUserId: string | null = null;

  // Initialize GTM with user data
  initialize() {
    if (this.isInitialized) return;

    // Ensure dataLayer exists
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      this.isInitialized = true;
      console.log('GTM Service initialized');
    }
  }

  // Generate GDPR-compliant hashed user ID
  private generateHashedUserId(user: User): string {
    // Create a simple hash from user ID + a constant salt
    // This ensures consistency while maintaining privacy
    const rawString = user.id + 'lwlnow_salt_2024';
    
    // Simple hash function (you might want to use a proper crypto hash in production)
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      const char = rawString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `user_${Math.abs(hash).toString(36)}`;
  }

  // Set user data in dataLayer - FIXED to include event attribute
  setUser(user: User | null) {
    if (!this.isInitialized) this.initialize();

    if (user) {
      this.currentUserId = this.generateHashedUserId(user);
      
      this.push({
        event: 'user_data_update',
        userId: this.currentUserId,
        userAuthenticated: true,
        userCreatedAt: user.created_at,
        userMetadata: {
          hasProfile: !!user.user_metadata,
          emailVerified: !!user.email_confirmed_at
        }
      });
    } else {
      this.currentUserId = null;
      this.push({
        event: 'user_data_update',
        userId: null,
        userAuthenticated: false
      });
    }
  }

  // Generic push to dataLayer
  push(data: GTMEvent | Record<string, any>) {
    if (!this.isInitialized) this.initialize();

    if (typeof window !== 'undefined' && window.dataLayer) {
      // Add timestamp and current user ID to all events
      const eventData = {
        ...data,
        timestamp: new Date().toISOString(),
        ...(this.currentUserId && { userId: this.currentUserId })
      };

      window.dataLayer.push(eventData);
      console.log('GTM Event pushed:', eventData);
    }
  }

  // Specific event tracking methods
  trackCTAClick(data: Omit<CTAClickEvent, 'event'>) {
    this.push({
      event: 'cta_click',
      ...data,
      page_url: window.location.href,
      user_authenticated: !!this.currentUserId
    });
  }

  trackFeatureUsed(data: Omit<FeatureUsedEvent, 'event'>) {
    this.push({
      event: 'feature_used',
      ...data,
      user_id: this.currentUserId
    });
  }

  trackUserLogin(data: Omit<UserLoginEvent, 'event' | 'user_id'>, user: User) {
    const hashedUserId = this.generateHashedUserId(user);
    this.push({
      event: 'user_login',
      ...data,
      user_id: hashedUserId
    });
  }

  trackUserLogout() {
    this.push({
      event: 'user_logout',
      user_id: this.currentUserId
    });
  }

  trackPageView(data: Omit<PageViewEvent, 'event' | 'user_id' | 'user_authenticated'>) {
    this.push({
      event: 'page_view',
      ...data,
      user_id: this.currentUserId,
      user_authenticated: !!this.currentUserId
    });
  }

  // Utility method to add GTM data attributes to elements
  addDataAttributes(element: HTMLElement, attributes: Record<string, string>) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(`data-gtm-${key}`, value);
    });
  }
}

// Create singleton instance
export const gtmService = new GTMService();

// Type declarations for window.dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}
