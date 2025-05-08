
import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

interface GoogleAuthButtonProps {
  isSignUp?: boolean;
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ isSignUp = false, className = '' }) => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
      },
    });

    if (error) {
      console.error('Error with Google auth:', error.message);
    }
  };

  return (
    <Button 
      onClick={handleGoogleSignIn} 
      variant="outline" 
      className={`w-full flex items-center justify-center gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      type="button"
    >
      <FcGoogle className="h-5 w-5" aria-hidden="true" />
      <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
    </Button>
  );
};
