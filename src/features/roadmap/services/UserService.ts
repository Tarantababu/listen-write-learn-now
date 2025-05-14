
import { BaseService } from './BaseService';
import { ServiceResponse } from '../types/service-types';
import { supabase } from '@/integrations/supabase/client';

class UserService extends BaseService {
  /**
   * Gets the current authenticated user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;
      
      return user;
    } catch (error) {
      this.handleError('getCurrentUser', error);
      return null;
    }
  }
  
  /**
   * Gets the user profile
   */
  async getUserProfile(userId: string): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      return {
        status: 'success',
        data
      };
    } catch (error) {
      return this.handleServiceError('getUserProfile', error);
    }
  }
}

export const userService = new UserService();
