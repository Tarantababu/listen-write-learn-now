
import { supabase } from '@/integrations/supabase/client';
import { ServiceResponse } from '../types/service-types';

export class BaseService {
  protected supabase = supabase;
  
  /**
   * Helper to create consistent success responses
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      data,
      error: null,
      status: 'success'
    };
  }
  
  /**
   * Helper to create consistent error responses
   */
  protected error<T>(message: string): ServiceResponse<T> {
    console.error(`Service error: ${message}`);
    return {
      data: null,
      error: message,
      status: 'error'
    };
  }
  
  /**
   * Helper to handle service errors consistently
   */
  protected handleError<T>(error: any): ServiceResponse<T> {
    const errorMessage = error.message || 'An unknown error occurred';
    console.error('Service error:', error);
    return this.error(errorMessage);
  }
  
  /**
   * Check if the user is authenticated
   */
  protected async ensureAuthenticated(): Promise<{ userId: string } | null> {
    try {
      const { data } = await this.supabase.auth.getUser();
      if (!data.user) {
        return null;
      }
      return { userId: data.user.id };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }
}
