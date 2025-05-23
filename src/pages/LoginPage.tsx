import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Headphones, Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
const LoginPage: React.FC = () => {
  const {
    signIn,
    signInWithGoogle,
    user
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  // If user is already logged in, redirect to dashboard page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gradient-to-br from-background via-background to-accent/10">
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
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">lwlnow</h1>
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Log In</CardTitle>
          <CardDescription className="text-sm mb-2">
            Enter your email and password to access your account
          </CardDescription>
          <div className="px-2 sm:px-4">
            <Alert className="bg-primary/5 border-primary/10 mb-2">
              <AlertTitle>Improve your language skills</AlertTitle>
              <AlertDescription>
                Sign in to access personalized dictation exercises, vocabulary tracking, and progress analytics.
              </AlertDescription>
            </Alert>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="border-input focus:border-primary" />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="border-input focus:border-primary" />
            </div>
            
            {error && <div className="text-xs sm:text-sm text-destructive">{error}</div>}

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90" disabled={isLoading}>
              {isLoading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </> : 'Sign In with Email'}
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
            
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
              {isGoogleLoading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </> : <>
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                  </svg>
                  Sign in with Google
                </>}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pt-0 pb-6">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Create account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>;
};
export default LoginPage;