
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

const VISITOR_ID_KEY = 'lwl_visitor_id';
const VISITOR_EXPIRY_DAYS = 365; // Store ID for 1 year

/**
 * Get or create a visitor ID and store in localStorage
 */
export const getVisitorId = (): string => {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  
  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  
  return visitorId;
};

/**
 * Track a page view
 */
export const trackPageView = async (page: string): Promise<void> => {
  try {
    const visitorId = getVisitorId();
    
    // Add timeout to prevent long-running requests
    const timeoutId = setTimeout(() => {
      console.warn('Page view tracking timed out');
    }, 5000);
    
    const response = await supabase.functions.invoke('track-visitor', {
      body: {
        visitorId,
        page,
        referer: document.referrer || null,
        userAgent: navigator.userAgent
      }
    }).catch(err => {
      console.warn('Page tracking network error:', err.message);
      return { error: { message: err.message } };
    });
    
    clearTimeout(timeoutId);
    
    if (response.error) {
      console.warn(`Page view tracking failed: ${response.error.message}`);
      return;
    }
    
    console.log(`Page view tracked: ${page}`);
  } catch (error) {
    // Log but don't throw error - tracking shouldn't break the app
    console.warn('Failed to track page view:', error);
  }
};

/**
 * Track a button click event
 */
export const trackButtonClick = async (buttonName: string): Promise<void> => {
  try {
    const visitorId = getVisitorId();
    
    // Add timeout to prevent long-running requests
    const timeoutId = setTimeout(() => {
      console.warn('Button click tracking timed out');
    }, 5000);
    
    const response = await supabase.functions.invoke('track-visitor', {
      body: {
        visitorId,
        page: `button_click:${buttonName}`,
        referer: document.referrer || null,
        userAgent: navigator.userAgent
      }
    }).catch(err => {
      console.warn('Button tracking network error:', err.message);
      return { error: { message: err.message } };
    });
    
    clearTimeout(timeoutId);
    
    if (response.error) {
      console.warn(`Button click tracking failed: ${response.error.message}`);
      return;
    }
    
    console.log(`Button click tracked: ${buttonName}`);
  } catch (error) {
    // Log but don't throw error - tracking shouldn't break the app
    console.warn('Failed to track button click:', error);
  }
};

/**
 * Apply database migrations (admin only)
 */
export const applyMigrations = async (): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('apply-migrations')
      .catch(err => {
        console.error('Migrations network error:', err.message);
        return { error: { message: err.message } };
      });
    
    if (error) {
      console.error('Failed to apply migrations:', error);
      return;
    }
    
    console.log('Database migrations applied successfully');
  } catch (error) {
    console.error('Failed to apply migrations:', error);
  }
};
