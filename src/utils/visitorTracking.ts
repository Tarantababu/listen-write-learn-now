
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

const VISITOR_ID_KEY = 'lwl_visitor_id';
const TUTORIAL_VIEWED_KEY = 'lwl_tutorial_viewed';
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
 * Check if the tutorial has been viewed by current user
 */
export const hasTutorialBeenViewed = (): boolean => {
  const value = localStorage.getItem(TUTORIAL_VIEWED_KEY);
  return value === 'true';
};

/**
 * Mark the tutorial as viewed
 */
export const markTutorialAsViewed = (): void => {
  localStorage.setItem(TUTORIAL_VIEWED_KEY, 'true');
};

/**
 * Track a page view
 */
export const trackPageView = async (page: string): Promise<void> => {
  try {
    const visitorId = getVisitorId();
    
    // Create a new date object and get ISO string for accurate timestamp
    const timestamp = new Date().toISOString();
    
    const response = await supabase.functions.invoke('track-visitor', {
      body: {
        visitorId,
        page,
        referer: document.referrer || null,
        userAgent: navigator.userAgent,
        timestamp
      }
    });
    
    if (response.error) {
      console.error('Error tracking page view:', response.error);
      return;
    }
    
    console.log(`Page view tracked: ${page} at ${timestamp}`);
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
    const timestamp = new Date().toISOString();
    
    const response = await supabase.functions.invoke('track-visitor', {
      body: {
        visitorId,
        page: `button_click:${buttonName}`,
        referer: document.referrer || null,
        userAgent: navigator.userAgent,
        timestamp
      }
    });
    
    if (response.error) {
      console.error('Error tracking button click:', response.error);
      return;
    }
    
    console.log(`Button click tracked: ${buttonName} at ${timestamp}`);
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
