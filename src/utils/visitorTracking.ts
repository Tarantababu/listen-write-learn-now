
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

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
    
    await supabase.functions.invoke('track-visitor', {
      body: {
        visitorId,
        page,
        referer: document.referrer || null,
        userAgent: navigator.userAgent
      }
    });
    
    console.log(`Page view tracked: ${page}`);
  } catch (error) {
    console.error('Failed to track page view:', error);
    // Continue execution even if tracking fails
  }
};

/**
 * Track a button click event
 */
export const trackButtonClick = async (buttonName: string): Promise<void> => {
  try {
    const visitorId = getVisitorId();
    
    await supabase.functions.invoke('track-visitor', {
      body: {
        visitorId,
        page: `button_click:${buttonName}`,
        referer: document.referrer || null,
        userAgent: navigator.userAgent
      }
    });
    
    console.log(`Button click tracked: ${buttonName}`);
  } catch (error) {
    console.error('Failed to track button click:', error);
    // Continue execution even if tracking fails
  }
};

/**
 * Apply database migrations (admin only)
 */
export const applyMigrations = async (): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('apply-migrations');
    
    if (error) {
      console.error('Failed to apply migrations:', error);
      return;
    }
    
    console.log('Database migrations applied successfully');
  } catch (error) {
    console.error('Failed to apply migrations:', error);
  }
};
