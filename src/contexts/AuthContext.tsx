import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { gtmService } from '@/services/gtmService';
import { posthogService } from '@/services/posthogService';

interface AuthContextProps {
  user: User | null;
  login: (email?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  logout: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
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
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
