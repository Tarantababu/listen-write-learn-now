import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { hasTutorialBeenViewed } from '@/utils/visitorTracking';
import { EmailService } from '@/services/emailService';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  isNewUser: boolean;
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
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // First set up auth state listener to avoid missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Initialize user profile on sign in
          setTimeout(() => {
            initializeUserProfile(session.user.id);
          }, 0);
          
          // Check if tutorial needs to be shown
          const tutorialViewed = hasTutorialBeenViewed();
          
          // Only navigate if not already on dashboard routes to prevent unnecessary remounts
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/dashboard')) {
            if (!tutorialViewed) {
              navigate('/dashboard/tutorial');
            } else {
              navigate('/dashboard');
            }
          }
        }
        
        if (event === 'SIGNED_OUT') {
          // Only redirect if not already on login/public pages
          const currentPath = window.location.pathname;
          if (currentPath.startsWith('/dashboard')) {
            navigate('/login');
          }
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
  }, [navigate]);

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
      // This also means this is likely a new user
      if (!data) {
        setIsNewUser(true);
        
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            learning_languages: ['english', 'german'],
            selected_language: 'english'
          });
        
        if (error) throw error;
      } else {
        setIsNewUser(false);
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
      // Navigation handled by auth state change listener
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
      const { error, data } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
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
        }
      }
      
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
      
      // Always show success message
      toast.success('Signed out successfully');
      
      // Navigate to login without force refresh to maintain app stability
      navigate('/login', { replace: true });
    } catch (error: any) {
      // Only show error toast for non-session-missing errors
      if (!error.message.includes('Auth session missing')) {
        toast.error(error.message || 'Failed to sign out');
      } else {
        // For session missing errors, still show success and redirect
        toast.success('Signed out successfully');
        navigate('/login', { replace: true });
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
    isNewUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
