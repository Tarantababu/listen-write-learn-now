
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    toast.error(error.message);
    throw error;
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

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error && !error.message.includes('Auth session missing')) {
      toast.error(error.message);
      throw error;
    }
  } catch (error: any) {
    if (!error.message.includes('Auth session missing')) {
      toast.error(error.message);
      throw error;
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
