
import { supabase } from '@/integrations/supabase/client';
import { ServiceResponse } from '../types/service-types';

export class BaseService {
  protected supabase = supabase;
  
  /**
   * Ensures the user is authenticated and returns user info
   * @returns Object with userId and email if authenticated, null otherwise
   */
  protected async ensureAuthenticated() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return null;
      }
      return {
        userId: user.id,
        email: user.email
      };
    } catch (error) {
      console.error('Error checking authentication:', error);
      return null;
    }
  }
  
  /**
   * Create a success response
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      status: 'success',
      data,
      error: null
    };
  }
  
  /**
   * Create an error response
   */
  protected error<T>(message: string): ServiceResponse<T> {
    return {
      status: 'error',
      data: null,
      error: message
    };
  }
  
  /**
   * Handle errors consistently
   */
  protected handleError<T>(methodName: string, error: any): ServiceResponse<T> {
    console.error(`${this.constructor.name}.${methodName} error:`, error);
    const errorMessage = error?.message || 'An unexpected error occurred';
    return {
      status: 'error',
      error: errorMessage,
      data: null
    };
  }
}
