
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First set up auth state listener to avoid missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          // Initialize user profile on sign in
          setTimeout(() => {
            initializeUserProfile(session!.user.id);
          }, 0);
          
          // Instead of navigate, use window.location for redirects
          if (!window.location.pathname.includes('/dashboard')) {
            window.location.href = '/dashboard';
          }
        }
        
        if (event === 'SIGNED_OUT') {
          // Instead of navigate, use window.location for redirects
          window.location.href = '/login';
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          initializeUserProfile(session.user.id);
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initialize user profile if it doesn't exist
  const initializeUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // If profile doesn't exist, create one with default settings
      if (!data) {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            learning_languages: ['english', 'german'],
            selected_language: 'english'
          });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error initializing user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast.success('Signed in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      
      if (error) throw error;
      
      // No need for toast here as we're redirecting to Google
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      toast.success('Account created successfully. Please check your email for verification.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first to ensure UI responds immediately
      setSession(null);
      setUser(null);
      
      // Attempt sign out
      const { error } = await supabase.auth.signOut();
      
      // If there's an error that's not related to missing session, throw it
      if (error && !error.message.includes('Auth session missing')) {
        throw error;
      }
      
      // Always show success message and redirect
      toast.success('Signed out successfully');
      
      // Explicitly redirect to login page
      window.location.href = '/login'; // Force full page refresh to clear any remaining state
    } catch (error: any) {
      // Only show error toast for non-session-missing errors
      if (!error.message.includes('Auth session missing')) {
        toast.error(error.message || 'Failed to sign out');
      } else {
        // For session missing errors, still show success and redirect
        toast.success('Signed out successfully');
        window.location.href = '/login';
      }
    }
  };

  const value = {
    session,
    user,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
