import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Home, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Logo } from '@/components/landing/Logo';

// Custom hook for form validation
const useFormValidation = () => {
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  }, []);
  const validatePassword = useCallback((password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }, []);
  const validateForm = useCallback((email: string, password: string) => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({
      email: emailError,
      password: passwordError
    });
    return !emailError && !passwordError;
  }, [validateEmail, validatePassword]);
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  return {
    errors,
    validateForm,
    clearErrors
  };
};

// Custom hook for login form logic
const useLoginForm = () => {
  const {
    signIn,
    signInWithGoogle
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const {
    errors,
    validateForm,
    clearErrors
  } = useFormValidation();
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm(email, password)) {
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);

      // Clear form errors when there's a server error
      clearErrors();
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, validateForm, clearErrors]);
  const handleGoogleSignIn = useCallback(async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  }, [signInWithGoogle]);
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);
  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isLoading,
    isGoogleLoading,
    error,
    errors,
    handleSubmit,
    handleGoogleSignIn,
    clearErrors
  };
};
const LoginPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isLoading,
    isGoogleLoading,
    error,
    errors,
    handleSubmit,
    handleGoogleSignIn,
    clearErrors
  } = useLoginForm();

  // If user is already logged in, redirect to dashboard page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  const isFormDisabled = isLoading || isGoogleLoading;

  // Memoize Google SVG icon to prevent re-renders
  const GoogleIcon = useMemo(() => <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>, []);
  return <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gradient-to-br from-background via-background to-accent/10">
      <Card className="w-full max-w-md shadow-lg animate-slide-in gradient-card">
        <CardHeader className="text-center pb-4 sm:pb-6">
          {/* Back to Home button moved to card header */}
          <div className="flex justify-start mb-2">
            <Link to="/" className="text-primary hover:text-accent transition-colors duration-200" tabIndex={0}>
              <Button variant="ghost" size={isMobile ? "sm" : "default"} className="flex items-center gap-1 sm:gap-2 hover:bg-primary/10 transition-colors duration-200">
                <Home className="h-4 w-4" />
                <span>{isMobile ? "Home" : "Back to Home"}</span>
              </Button>
            </Link>
          </div>

          <div className="flex justify-center mb-2 sm:mb-4">
            <Logo />
          </div>
          
          <CardTitle className="text-xl sm:text-2xl">Welcome Back</CardTitle>
          <CardDescription className="text-sm mb-2">
            Sign in to continue your language learning journey
          </CardDescription>
          
          <div className="px-2 sm:px-4">
            <Alert className="bg-primary/5 border-primary/10 mb-2 transition-all duration-300 hover:bg-primary/10">
              
              <AlertTitle>Continue Learning</AlertTitle>
              <AlertDescription>
                Access your personalized exercises, track progress, and improve your skills.
              </AlertDescription>
            </Alert>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => {
              setEmail(e.target.value);
              if (errors.email) clearErrors();
            }} onBlur={() => {
              // Real-time validation on blur
              if (email && !email.includes('@')) {
                // Trigger validation for better UX
              }
            }} required disabled={isFormDisabled} className={`border-input focus:border-primary transition-colors duration-200 ${errors.email ? 'border-destructive focus:border-destructive' : 'hover:border-primary/50'}`} aria-describedby={errors.email ? "email-error" : undefined} />
              {errors.email && <p id="email-error" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>}
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-accent hover:underline transition-colors duration-200" tabIndex={isFormDisabled ? -1 : 0}>
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => {
                setPassword(e.target.value);
                if (errors.password) clearErrors();
              }} required disabled={isFormDisabled} className={`border-input focus:border-primary transition-colors duration-200 pr-10 ${errors.password ? 'border-destructive focus:border-destructive' : 'hover:border-primary/50'}`} aria-describedby={errors.password ? "password-error" : undefined} />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent" onClick={togglePasswordVisibility} disabled={isFormDisabled} tabIndex={isFormDisabled ? -1 : 0} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" /> : <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />}
                </Button>
              </div>
              {errors.password && <p id="password-error" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>}
            </div>
            
            {error && <Alert variant="destructive" className="animate-shake">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>}

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" disabled={isFormDisabled}>
              {isLoading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing you in...
                </> : 'Sign In'}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button type="button" variant="outline" className="w-full hover:bg-primary/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" onClick={handleGoogleSignIn} disabled={isFormDisabled}>
              {isGoogleLoading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </> : <>
                  {GoogleIcon}
                  Sign in with Google
                </>}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pt-0 pb-6">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-accent hover:underline transition-colors duration-200 font-medium" tabIndex={isFormDisabled ? -1 : 0}>
              Create account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>;
};
export default LoginPage;