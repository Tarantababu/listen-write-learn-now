import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Headphones, Home, Eye, EyeOff, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Custom hook for form validation
const useFormValidation = () => {
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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

  return { errors, validateForm, clearErrors };
};

// Custom hook for login form logic
const useLoginForm = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { errors, validateForm, clearErrors } = useFormValidation();

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
  const { user } = useAuth();
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
  const GoogleIcon = useMemo(() => (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  ), []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/50 to-indigo-950/30"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(120,119,198,0.2),transparent_50%)]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Glassmorphism Card */}
      <Card className="w-full max-w-md relative z-10 backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl shadow-black/50">
        <CardHeader className="text-center pb-6 relative">
          {/* Back to Home button - Ultra modern style */}
          <div className="absolute -top-2 -left-2">
            <Link 
              to="/" 
              className="group"
              tabIndex={0}
            >
              <Button 
                variant="ghost" 
                size="sm"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:rotate-3 p-0"
              >
                <Home className="h-4 w-4 text-white/80 group-hover:text-white transition-colors" />
              </Button>
            </Link>
          </div>

          {/* Logo Section */}
          <div className="flex justify-center mb-6 relative">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm border border-white/30">
              <div className="relative">
                <Headphones className="h-8 w-8 text-white drop-shadow-lg" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                </div>
              </div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-200 tracking-tight">
                lwlnow
              </h1>
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold text-white mb-2 tracking-tight">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-white/70 text-lg mb-6 font-medium">
            Continue your learning journey
          </CardDescription>
          
          {/* Feature Highlight */}
          <div className="px-4">
            <Alert className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/30 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <AlertTitle className="text-white font-semibold">Premium Experience</AlertTitle>
              <AlertDescription className="text-white/80">
                AI-powered exercises, real-time feedback, and personalized learning paths.
              </AlertDescription>
            </Alert>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90 text-sm font-medium tracking-wide">
                Email Address
              </Label>
              <div className="relative group">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={email} 
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) clearErrors();
                  }}
                  required 
                  disabled={isFormDisabled}
                  className={`
                    h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 
                    focus:bg-white/20 focus:border-white/50 focus:ring-2 focus:ring-white/20
                    backdrop-blur-sm transition-all duration-300 rounded-xl
                    hover:bg-white/15 group-hover:border-white/40
                    ${errors.email ? 'border-red-400/60 bg-red-500/10' : ''}
                  `}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-focus-within:from-blue-500/20 group-focus-within:via-purple-500/20 group-focus-within:to-pink-500/20 transition-all duration-500 -z-10"></div>
              </div>
              {errors.email && (
                <p id="email-error" className="text-red-300 text-xs flex items-center gap-2 animate-in slide-in-from-left-2">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-white/90 text-sm font-medium tracking-wide">
                  Password
                </Label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-white/70 hover:text-white transition-colors duration-200 hover:underline underline-offset-2"
                  tabIndex={isFormDisabled ? -1 : 0}
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••" 
                  value={password} 
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) clearErrors();
                  }}
                  required 
                  disabled={isFormDisabled}
                  className={`
                    h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 
                    focus:bg-white/20 focus:border-white/50 focus:ring-2 focus:ring-white/20
                    backdrop-blur-sm transition-all duration-300 rounded-xl pr-12
                    hover:bg-white/15 group-hover:border-white/40
                    ${errors.password ? 'border-red-400/60 bg-red-500/10' : ''}
                  `}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/20 rounded-lg transition-all duration-200"
                  onClick={togglePasswordVisibility}
                  disabled={isFormDisabled}
                  tabIndex={isFormDisabled ? -1 : 0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-white/70 hover:text-white transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/70 hover:text-white transition-colors" />
                  )}
                </Button>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-focus-within:from-blue-500/20 group-focus-within:via-purple-500/20 group-focus-within:to-pink-500/20 transition-all duration-500 -z-10"></div>
              </div>
              {errors.password && (
                <p id="password-error" className="text-red-300 text-xs flex items-center gap-2 animate-in slide-in-from-left-2">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>
            
            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-500/20 border-red-400/30 backdrop-blur-sm animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 text-red-300" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {/* Sign In Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/25 active:scale-[0.98] border-0 relative overflow-hidden group" 
              disabled={isFormDisabled}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing you in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/10 backdrop-blur-sm px-4 py-1 text-white/70 rounded-full border border-white/20 font-medium tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>
            
            {/* Google Sign In Button */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] rounded-xl font-medium group" 
              onClick={handleGoogleSignIn} 
              disabled={isFormDisabled}
            >
              {isGoogleLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {GoogleIcon}
                  </div>
                  <span>Continue with Google</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pt-4 pb-8">
          <p className="text-white/70 text-sm">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-white font-semibold hover:text-blue-200 transition-colors duration-200 underline underline-offset-2 decoration-white/50 hover:decoration-blue-200"
              tabIndex={isFormDisabled ? -1 : 0}
            >
              Create account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;