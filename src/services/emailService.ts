
import { supabase } from '@/integrations/supabase/client';

export interface WelcomeEmailData {
  email: string;
  name?: string;
}

export class EmailService {
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

  static async sendWelcomeEmail(emailData: WelcomeEmailData) {
    console.log('Sending welcome email to:', emailData.email);
    return this.callEmailFunction('send-welcome-email', emailData);
  }

  // Future email types can be added here
  // static async sendPasswordResetEmail(emailData: PasswordResetEmailData) { ... }
  // static async sendNotificationEmail(emailData: NotificationEmailData) { ... }
}
