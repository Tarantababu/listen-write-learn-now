
import { supabase } from '@/integrations/supabase/client';

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
   * Create a standardized success response
   */
  protected success<T>(data: T): { data: T, error: null, status: 'success' } {
    return {
      data,
      error: null,
      status: 'success'
    };
  }
  
  /**
   * Create a standardized error response
   */
  protected error<T>(message: string): { data: null, error: string, status: 'error' } {
    return {
      data: null,
      error: message,
      status: 'error'
    };
  }
  
  /**
   * Handle errors consistently
   */
  protected handleError(error: any) {
    console.error('Service error:', error);
    const errorMessage = error?.message || 'An unexpected error occurred';
    return this.error(errorMessage);
  }
}
