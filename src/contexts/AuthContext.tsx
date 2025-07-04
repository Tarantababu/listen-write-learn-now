
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { gtmService } from '@/services/gtmService';
import { posthogService } from '@/services/posthogService';
import { signUp as authSignUp, signIn as authSignIn, signInWithGoogle as authSignInWithGoogle, signOut as authSignOut } from '@/lib/auth';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  login: (email?: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  loading: boolean;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  login: async () => {},
  logout: async () => {},
  signOut: async () => {},
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => ({ data: null, error: null }),
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);
        
        // Set user data in GTM
        gtmService.setUser(session?.user ?? null);
        
        // Set user data in PostHog
        posthogService.setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          // Track login in GTM
          gtmService.trackUserLogin({
            login_method: 'email', // You might want to make this dynamic
            is_new_user: false // You might want to determine this
          }, session.user);
          
          // Track login in PostHog
          posthogService.trackUserLogin({
            login_method: 'email', // You might want to make this dynamic
            is_new_user: false // You might want to determine this
          }, session.user);
        }

        if (event === 'SIGNED_OUT') {
          // Track logout in GTM
          gtmService.trackUserLogout();
          
          // Track logout in PostHog
          posthogService.trackUserLogout();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email?: string) => {
    setLoading(true);
    try {
      if (email) {
        // Send magic link email
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        alert('Check your email for the login link!');
      } else {
        // Sign in with Google
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    return authSignOut();
  };

  const signOut = async () => {
    return authSignOut();
  };

  const signIn = async (email: string, password: string) => {
    return authSignIn(email, password);
  };

  const signUp = async (email: string, password: string) => {
    return authSignUp(email, password);
  };

  const signInWithGoogle = async () => {
    return authSignInWithGoogle();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      login, 
      logout, 
      signOut,
      signIn,
      signUp,
      signInWithGoogle,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
