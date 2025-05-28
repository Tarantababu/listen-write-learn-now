import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EmailService } from '@/services/emailService';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    toast.error(error.message);
    throw error;
  }

  // Send welcome email after successful signup
  if (data.user) {
    try {
      await EmailService.sendWelcomeEmail({
        email: data.user.email || email,
        name: data.user.user_metadata?.name
      });
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      // Don't fail the signup if email sending fails
      console.error('Failed to send welcome email:', emailError);
      // Optionally show a non-blocking toast
      toast('Account created successfully! Welcome email will be sent shortly.', {
        duration: 3000,
      });
    }
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    toast.error(error.message);
    throw error;
  }

  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/dashboard',
    }
  });

  if (error) {
    toast.error(error.message);
    throw error;
  }

  return data;
}

export async function signOut() {
  try {
    // Attempt sign out
    const { error } = await supabase.auth.signOut();
    
    if (error && !error.message.includes('Auth session missing')) {
      toast.error(error.message);
      throw error;
    }
    
    // Redirect to login page with full page refresh to clear state
    window.location.href = '/login';
  } catch (error: any) {
    if (!error.message.includes('Auth session missing')) {
      toast.error(error.message);
      throw error;
    } else {
      // Even with session missing error, redirect to login
      window.location.href = '/login';
    }
  }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
  
  return user;
}

export async function getProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }

  return data;
}

export async function updateProfile(updates: {
  learning_languages?: string[];
  selected_language?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('No user logged in');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    toast.error(error.message);
    throw error;
  }

  toast.success('Profile updated successfully');
}

export async function checkIsAdmin() {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Unexpected error checking admin status:', error);
    return false;
  }
}

export async function getUserRoles(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
    
    return data?.map(r => r.role) || [];
  } catch (error) {
    console.error('Unexpected error fetching user roles:', error);
    return [];
  }
}
