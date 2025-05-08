
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, Home, Headphones } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

const SignUpPage: React.FC = () => {
  const { signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isMobile = useIsMobile();

  // If user is already logged in, redirect to dashboard page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gradient-to-br from-background via-background to-accent/10">
      <Link to="/" className="absolute top-4 left-4 text-primary hover:text-accent transition-colors animate-fade-in">
        <Button variant="ghost" size={isMobile ? "sm" : "default"} className="flex items-center gap-1 sm:gap-2">
          <Home className="h-4 w-4" />
          <span>{isMobile ? "Home" : "Back to Home"}</span>
        </Button>
      </Link>
      
      <Card className="w-full max-w-md shadow-lg animate-slide-in gradient-card">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="flex items-center gap-2">
              <Headphones className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">ListenWriteLearn</h1>
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Create an Account</CardTitle>
          <CardDescription className="text-sm">
            Enter your details to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-3 sm:space-y-4">
              <Alert className="bg-primary/10 border-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs sm:text-sm">
                  Account created successfully! Check your email for verification instructions.
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link to="/login">
                  Proceed to Login
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <GoogleAuthButton isSignUp />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <div className="text-xs sm:text-sm text-destructive">{error}</div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-0 pb-6">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpPage;
