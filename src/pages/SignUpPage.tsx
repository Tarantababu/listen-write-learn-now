import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { updateProfile } from '@/lib/auth';
import { capitalizeLanguage, getLanguageFlag } from '@/utils/languageUtils';
import { FlagIcon, FlagIconCode } from 'react-flag-kit';
import { Logo } from '@/components/landing/Logo';

// Language to country code mapping
const getCountryCode = (language: string): FlagIconCode | null => {
  const languageMap: Record<string, FlagIconCode> = {
    'english': 'GB' as FlagIconCode,
    'spanish': 'ES' as FlagIconCode,
    'french': 'FR' as FlagIconCode,
    'german': 'DE' as FlagIconCode,
    'italian': 'IT' as FlagIconCode,
    'portuguese': 'PT' as FlagIconCode,
    'dutch': 'NL' as FlagIconCode,
    'turkish': 'TR' as FlagIconCode,
    'swedish': 'SE' as FlagIconCode,
    'norwegian': 'NO' as FlagIconCode
  };
  return languageMap[language.toLowerCase()] || null;
};

const SignUpPage: React.FC = () => {
  const { signUp, signInWithGoogle, user } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedLanguage = searchParams.get('lang');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // If user is already logged in, redirect to dashboard page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      await signUp(email, password);
      
      // If a language was selected, update the user's profile
      if (selectedLanguage) {
        try {
          await updateProfile({
            selected_language: selectedLanguage,
            learning_languages: [selectedLanguage]
          });
        } catch (profileError) {
          console.error('Failed to update language preference:', profileError);
          // Don't fail the signup if profile update fails
        }
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setIsGoogleLoading(true);
    
    try {
      await signInWithGoogle();
      // Note: For Google signup, we'll handle language setting in the dashboard
      // since the redirect happens immediately
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const countryCode = selectedLanguage ? getCountryCode(selectedLanguage) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gradient-to-br from-background via-background to-accent/10">
      <Card className={`w-full max-w-md shadow-lg transition-all duration-500 ease-out transform ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } gradient-card`}>
        
        {/* Card Header with Back Button */}
        <CardHeader className="text-center pb-4 sm:pb-6 relative">
          {/* Back to Home Button - Integrated into card */}
          <div className="absolute top-4 left-4">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors duration-200">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
          </div>
          
          {/* Logo and Title */}
          <div className="flex justify-center mb-3 sm:mb-4 mt-8 sm:mt-4">
            <Logo />
          </div>
          
          {/* Selected Language Display */}
          {selectedLanguage && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10 transition-colors duration-200">
              {countryCode ? (
                <div className="w-6 h-4 overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-gray-200/50 rounded-sm flex items-center justify-center">
                  <FlagIcon code={countryCode} size={24} />
                </div>
              ) : (
                <span className="text-lg">{getLanguageFlag(selectedLanguage)}</span>
              )}
              <span className="text-sm font-medium text-primary">
                Learning: {capitalizeLanguage(selectedLanguage)}
              </span>
            </div>
          )}
          
          <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground leading-relaxed">
            Join ListenWriteLearn and start mastering languages through interactive dictation exercises
          </CardDescription>
          
          {/* Value Proposition Alert */}
          <div className="px-2 sm:px-4 mt-4">
            <Alert className="bg-primary/5 border-primary/20 text-left">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle className="text-sm font-medium">Master languages through dictation</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                Access personalized exercises, track your progress, and build vocabulary effectively.
              </AlertDescription>
            </Alert>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Account Created!</h3>
                <p className="text-sm text-muted-foreground">
                  Check your email for verification instructions to complete your registration.
                </p>
              </div>
              <Button asChild className="w-full mt-4">
                <Link to="/login">
                  Continue to Sign In
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <Alert className="bg-destructive/10 border-destructive/20">
                  <AlertDescription className="text-sm text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Sign Up Button */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-200 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground font-medium">
                    Or continue with
                  </span>
                </div>
              </div>
              
              {/* Google Sign Up Button */}
              <Button 
                type="button"
                variant="outline" 
                className="w-full h-11 transition-all duration-200 hover:bg-accent/10"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pt-0 pb-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpPage;
