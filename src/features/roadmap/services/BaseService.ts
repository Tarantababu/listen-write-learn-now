
import { supabase } from "@/integrations/supabase/client";
import { ServiceResponse } from '../types/service-types';

/**
 * Base service class with common utilities
 */
export class BaseService {
  /**
   * The Supabase client instance
   */
  protected supabase = supabase;
  
  /**
   * Get current user information
   */
  protected getUser() {
    // In a real implementation, fetch from auth system
    // For now, mock a user
    return {
      id: 'user-1',
      email: 'user@example.com',
    };
  }

  /**
   * Ensure the user is authenticated
   * @returns The user object if authenticated, null otherwise
   */
  protected async ensureAuthenticated() {
    const user = this.getUser();
    if (!user) {
      return null;
    }
    return {
      userId: user.id,
      email: user.email
    };
  }

  /**
   * Create a success response
   * @param data The data to include in the response
   * @returns A success response object
   */
  protected success<T>(data: T | null): ServiceResponse<T> {
    return {
      status: 'success',
      data,
      error: null
    };
  }

  /**
   * Create an error response
   * @param errorMessage The error message
   * @returns An error response object
   */
  protected error<T>(errorMessage: string): ServiceResponse<T> {
    return {
      status: 'error',
      data: null,
      error: errorMessage
    };
  }

  /**
   * Handle an error and return an appropriate response
   * @param error The error object
   * @returns An error response object
   */
  protected handleError<T>(error: any): ServiceResponse<T> {
    console.error('Service error:', error);
    const errorMessage = error?.message || 'An unexpected error occurred';
    return this.error(errorMessage);
  }
}
