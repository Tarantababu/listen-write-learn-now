
import { supabase } from '@/integrations/supabase/client';
import { ServiceResponse } from '../types/service-types';

export abstract class BaseService {
  protected supabase = supabase;

  protected async ensureAuthenticated(): Promise<{ userId: string } | null> {
    const { data: sessionData } = await this.supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      console.warn('User is not authenticated');
      return null;
    }

    return { userId: session.user.id };
  }

  protected success<T>(data: T): ServiceResponse<T> {
    return {
      data,
      error: null,
      status: 'success'
    };
  }

  protected error<T>(message: string): ServiceResponse<T> {
    console.error(`Service error: ${message}`);
    return {
      data: null,
      error: message,
      status: 'error'
    };
  }

  protected handleError<T>(error: any): ServiceResponse<T> {
    const errorMessage = error?.message || 'An unknown error occurred';
    console.error('Service error:', error);
    return this.error(errorMessage);
  }
}
