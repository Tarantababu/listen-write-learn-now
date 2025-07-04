import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { hasTutorialBeenViewed } from '@/utils/visitorTracking';
import { EmailService } from '@/services/emailService';
import { ResendContactService } from '@/services/resendContactService';
import { gtmService } from '@/services/gtmService';

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
  const [processedUsers, setProcessedUsers] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize GTM service
    gtmService.initialize();

    // First set up auth state listener to avoid missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Update GTM with user data
        gtmService.setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a new user by looking at the created_at timestamp
          // If the user was created within the last 10 seconds, consider them new
          const userCreatedAt = new Date(session.user.created_at);
          const now = new Date();
          const timeDiff = now.getTime() - userCreatedAt.getTime();
          const isRecentlyCreated = timeDiff < 10000; // 10 seconds
          
          // Track login event
          gtmService.trackUserLogin({
            login_method: session.user.app_metadata?.provider === 'google' ? 'google' : 'email',
            is_new_user: isRecentlyCreated
          }, session.user);
          
          // Only process each user once per session to avoid duplicates
          if (isRecentlyCreated && !processedUsers.has(session.user.id)) {
            // Send welcome email
            await EmailService.sendWelcomeEmail({
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name
            });
            console.log('Welcome email sent successfully for OAuth user');
            
            // Create contact in Resend - handle Google OAuth metadata properly
            const firstName = session.user.user_metadata?.given_name || 
                              session.user.user_metadata?.first_name || 
                              null;
            const lastName = session.user.user_metadata?.family_name || 
                             session.user.user_metadata?.last_name || 
                             null;
            
            console.log('Google OAuth metadata:', {
              given_name: session.user.user_metadata?.given_name,
              family_name: session.user.user_metadata?.family_name,
              first_name: session.user.user_metadata?.first_name,
              last_name: session.user.user_metadata?.last_name,
              full_name: session.user.user_metadata?.full_name,
              name: session.user.user_metadata?.name
            });
            
            await ResendContactService.createContact({
              email: session.user.email || '',
              firstName: firstName,
              lastName: lastName
            });
            console.log('Resend contact created successfully for OAuth user');
          }
          
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
          // Track logout event
          gtmService.trackUserLogout();
          
          // Clear processed users on sign out
          setProcessedUsers(new Set());
          
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
      
      // Set GTM user data for existing session
      gtmService.setUser(session?.user ?? null);
      
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
      
      // Send welcome email and create Resend contact after successful signup
      if (data.user) {
        try {
          console.log('Attempting to send welcome email to:', data.user.email);
          await EmailService.sendWelcomeEmail({
            email: data.user.email || email,
            name: data.user.user_metadata?.name
          });
          console.log('Welcome email sent successfully');
          
          // Create contact in Resend
          console.log('Creating Resend contact for:', data.user.email);
          await ResendContactService.createContact({
            email: data.user.email || email,
            firstName: data.user.user_metadata?.first_name,
            lastName: data.user.user_metadata?.last_name
          });
          console.log('Resend contact created successfully');
          
          toast.success('Account created successfully! Welcome email sent. Please check your email for verification.');
        } catch (emailError) {
          // Don't fail the signup if email sending or contact creation fails
          console.error('Failed to send welcome email or create Resend contact:', emailError);
          toast.success('Account created successfully. Please check your email for verification.');
        }
      } else {
        toast.success('Account created successfully. Please check your email for verification.');
      }
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
