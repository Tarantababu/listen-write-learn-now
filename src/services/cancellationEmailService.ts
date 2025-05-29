
import { supabase } from '@/integrations/supabase/client';

export interface CancellationEmailData {
  email: string;
  name?: string;
}

export class CancellationEmailService {
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

  static async sendCancellationEmail(emailData: CancellationEmailData) {
    console.log('Sending subscription cancellation email to:', emailData.email);
    return this.callEmailFunction('send-cancellation-email', emailData);
  }

  /**
   * Check if user has already received the cancellation email
   */
  static async hasReceivedCancellationEmail(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('cancellation_email_sent')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking cancellation email status:', error);
        return false;
      }

      return data?.cancellation_email_sent || false;
    } catch (error) {
      console.error('Error in hasReceivedCancellationEmail:', error);
      return false;
    }
  }

  /**
   * Mark user as having received the cancellation email
   */
  static async markCancellationEmailSent(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ cancellation_email_sent: true })
        .eq('id', userId);

      if (error) {
        console.error('Error marking cancellation email as sent:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markCancellationEmailSent:', error);
      throw error;
    }
  }
}
