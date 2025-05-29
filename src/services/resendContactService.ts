
import { supabase } from '@/integrations/supabase/client';

export interface ResendContactData {
  email: string;
  firstName?: string;
  lastName?: string;
}

export class ResendContactService {
  private static async callEmailFunction(functionName: string, data: any) {
    try {
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: data,
      });

      if (error) {
        console.error(`Error calling ${functionName}:`, error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error(`Failed to call ${functionName}:`, error);
      throw error;
    }
  }

  static async createContact(contactData: ResendContactData) {
    console.log('Creating Resend contact for:', contactData.email);
    return this.callEmailFunction('create-resend-contact', contactData);
  }
}
