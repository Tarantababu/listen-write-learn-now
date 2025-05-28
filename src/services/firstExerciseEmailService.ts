
import { supabase } from '@/integrations/supabase/client';

export interface FirstExerciseEmailData {
  email: string;
  name?: string;
}

export class FirstExerciseEmailService {
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

  static async sendFirstExerciseEmail(emailData: FirstExerciseEmailData) {
    console.log('Sending first exercise completion email to:', emailData.email);
    return this.callEmailFunction('send-first-exercise-email', emailData);
  }

  /**
   * Check if user has already received the first exercise completion email
   */
  static async hasReceivedFirstExerciseEmail(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_exercise_email_sent')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking first exercise email status:', error);
        return false;
      }

      return data?.first_exercise_email_sent || false;
    } catch (error) {
      console.error('Error in hasReceivedFirstExerciseEmail:', error);
      return false;
    }
  }

  /**
   * Mark user as having received the first exercise completion email
   */
  static async markFirstExerciseEmailSent(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ first_exercise_email_sent: true })
        .eq('id', userId);

      if (error) {
        console.error('Error marking first exercise email as sent:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markFirstExerciseEmailSent:', error);
      throw error;
    }
  }
}
