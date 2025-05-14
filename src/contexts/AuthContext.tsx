
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const authInitialized = useRef(false);
  const profileInitialized = useRef<{[key: string]: boolean}>({});
  
  // Add throttling mechanism to prevent excessive profile initializations
  const profileInitThrottleTimeout = useRef<NodeJS.Timeout | null>(null);
  const authCheckThrottleTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastAuthCheck = useRef<number>(0);
  const AUTH_CHECK_INTERVAL = 10 * 60 * 1000; // Check auth at most every 10 minutes

  useEffect(() => {
    // Only run auth initialization once
    if (authInitialized.current) return;
    authInitialized.current = true;
    
    console.log("Setting up auth state listener (optimized)");
    
    // First set up auth state listener to avoid missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        
        // Only update state if there's an actual change to avoid rerenders
        const shouldUpdateState = !session || 
          !newSession || 
          session.access_token !== newSession.access_token;
        
        if (shouldUpdateState) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
        
        if (event === 'SIGNED_IN') {
          // Initialize user profile on sign in, but throttle to prevent rapid repeated calls
          if (newSession?.user && !profileInitialized.current[newSession.user.id]) {
            // Clear any pending profile initialization
            if (profileInitThrottleTimeout.current) {
              clearTimeout(profileInitThrottleTimeout.current);
            }
            
            // Set a small delay to batch potential repeated auth events
            profileInitThrottleTimeout.current = setTimeout(() => {
              initializeUserProfile(newSession.user.id);
              profileInitialized.current[newSession.user.id] = true;
              profileInitThrottleTimeout.current = null;
            }, 500);
          }
          
          // Redirect to dashboard on sign in
          navigate('/dashboard');
        }
        
        if (event === 'SIGNED_OUT') {
          // Ensure we redirect on sign out event and clear state
          setSession(null);
          setUser(null);
          navigate('/login');
        }
      }
    );

    // Then check for existing session - but only once and with throttling
    const now = Date.now();
    const timeSinceLastCheck = now - lastAuthCheck.current;
    
    if (timeSinceLastCheck > AUTH_CHECK_INTERVAL) {
      lastAuthCheck.current = now;
      
      supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
        console.log("Initial session check:", existingSession ? "Session found" : "No session");
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        setLoading(false);
        
        if (existingSession?.user && !profileInitialized.current[existingSession.user.id]) {
          // Use throttling for profile initialization
          if (profileInitThrottleTimeout.current) {
            clearTimeout(profileInitThrottleTimeout.current);
          }
          
          profileInitThrottleTimeout.current = setTimeout(() => {
            initializeUserProfile(existingSession.user.id);
            profileInitialized.current[existingSession.user.id] = true;
            profileInitThrottleTimeout.current = null;
          }, 500);
        }
      });
    } else {
      // Skip redundant auth check if we checked recently
      console.log("Skipping redundant auth check - last check was", 
        Math.round(timeSinceLastCheck/1000), "seconds ago");
      setLoading(false);
    }

    return () => {
      // Clean up all timeouts and subscriptions
      if (profileInitThrottleTimeout.current) {
        clearTimeout(profileInitThrottleTimeout.current);
      }
      if (authCheckThrottleTimeout.current) {
        clearTimeout(authCheckThrottleTimeout.current);
      }
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Initialize user profile if it doesn't exist - now with debouncing
  const initializeUserProfile = async (userId: string) => {
    try {
      console.log("Initializing user profile for:", userId);
      
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
        console.log("Created new user profile");
      } else {
        console.log("User profile already exists");
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
      navigate('/dashboard');
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
