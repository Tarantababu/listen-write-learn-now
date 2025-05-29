
import { supabase } from '@/integrations/supabase/client';

export interface PremiumEmailData {
  email: string;
  name?: string;
}

export class PremiumEmailService {
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

  static async sendPremiumEmail(emailData: PremiumEmailData) {
    console.log('Sending premium subscription email to:', emailData.email);
    return this.callEmailFunction('send-premium-email', emailData);
  }

  /**
   * Check if user has already received the premium subscription email
   */
  static async hasReceivedPremiumEmail(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('premium_email_sent')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking premium email status:', error);
        return false;
      }

      return data?.premium_email_sent || false;
    } catch (error) {
      console.error('Error in hasReceivedPremiumEmail:', error);
      return false;
    }
  }

  /**
   * Mark user as having received the premium subscription email
   */
  static async markPremiumEmailSent(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ premium_email_sent: true })
        .eq('id', userId);

      if (error) {
        console.error('Error marking premium email as sent:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markPremiumEmailSent:', error);
      throw error;
    }
  }
}
