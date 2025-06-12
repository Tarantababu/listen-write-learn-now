import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom"; 
import { AuthProvider } from "@/contexts/AuthContext";
import { ExerciseProvider } from './contexts/ExerciseContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { VocabularyProvider } from './contexts/VocabularyContext';
import { DirectoryProvider } from './contexts/DirectoryContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { GTMTracker } from '@/components/GTMTracker';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from 'sonner';
import React from 'react';

import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import HomePage from "@/pages/HomePage";
import ExercisesPage from "@/pages/ExercisesPage";
import VocabularyPage from "@/pages/VocabularyPage";
import CurriculumPage from "@/pages/CurriculumPage"; 
import SettingsPage from "@/pages/SettingsPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import AdminPage from "@/pages/AdminPage";
import TutorialPage from "@/pages/TutorialPage";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import LanguageSelectionPage from "@/pages/LanguageSelectionPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CookiePolicy from "@/pages/CookiePolicy";
import BlogPostEditor from "@/components/blog/admin/BlogPostEditor";

// Create Blog-related pages
import BlogPage from "@/pages/BlogPage"; 
import BlogPostPage from "@/pages/BlogPostPage";

// Error Fallback Component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const getErrorInfo = (error: Error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('supabase') || message.includes('database') || error.name === 'PostgrestError') {
      return {
        title: 'Database Connection Issue',
        description: 'We\'re having trouble connecting to our database. This might be a temporary issue.',
        icon: '🔌',
        color: 'text-amber-600 dark:text-amber-400'
      };
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return {
        title: 'Network Connection Problem',
        description: 'Please check your internet connection and try again.',
        icon: '🌐',
        color: 'text-blue-600 dark:text-blue-400'
      };
    }
    
    if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
      return {
        title: 'Authentication Issue',
        description: 'Your session may have expired. Please try logging in again.',
        icon: '🔐',
        color: 'text-purple-600 dark:text-purple-400'
      };
    }
    
    return {
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred. Our team has been notified.',
      icon: '⚠️',
      color: 'text-red-600 dark:text-red-400'
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-6 text-center">
            <div className="text-4xl mb-3">{errorInfo.icon}</div>
            <h1 className={`text-xl font-bold ${errorInfo.color} mb-2`}>
              {errorInfo.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {errorInfo.description}
            </p>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Action Buttons */}
            <div className="grid gap-3">
              <button
                onClick={resetErrorBoundary}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-2 px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
              >
                ← Go to Homepage
              </button>
            </div>
            
            {/* Error Details (Development) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium mb-2">
                  🔍 Technical Details (Development Mode)
                </summary>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-mono text-gray-700 dark:text-gray-300 space-y-2">
                    <div>
                      <span className="font-semibold text-red-600 dark:text-red-400">Error:</span>
                      <div className="mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-4 border-red-400">
                        {error.name}: {error.message}
                      </div>
                    </div>
                    {error.stack && (
                      <div>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Stack Trace:</span>
                        <pre className="mt-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs overflow-auto max-h-32 border-l-4 border-blue-400">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}

// Enhanced QueryClient with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry for auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry network/server errors up to 2 times
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      onError: (error: any) => {
        console.error('Query error:', error);
        
        // Show elegant error notifications
        if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
          toast.error('Connection issue detected', {
            description: 'Please check your internet connection'
          });
        } else if (error?.status === 401) {
          toast.error('Session expired', {
            description: 'Please log in again'
          });
        } else if (error?.message?.includes('supabase') || error?.message?.includes('database')) {
          toast.error('Service temporarily unavailable', {
            description: 'Please try again in a moment'
          });
        }
      }
    },
    mutations: {
      onError: (error: any) => {
        console.error('Mutation error:', error);
        
        if (error?.message?.includes('supabase') || error?.message?.includes('database')) {
          toast.error('Failed to save changes', {
            description: 'Database connection issue'
          });
        } else if (error?.status === 401) {
          toast.error('Authentication required', {
            description: 'Please log in again'
          });
        } else if (error?.status === 403) {
          toast.error('Permission denied', {
            description: 'You don\'t have access to this action'
          });
        } else {
          toast.error('Operation failed', {
            description: 'Please try again'
          });
        }
      }
    }
  }
});

// Global error handlers
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
    
    const error = event.reason;
    if (error?.message?.includes('supabase') || error?.message?.includes('database')) {
      toast.error('Service connection lost', {
        description: 'Reconnecting automatically...'
      });
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      toast.error('Network connection lost', {
        description: 'Please check your internet connection'
      });
    }
  });

  // Handle global JavaScript errors (less intrusive)
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Only show notification for critical errors in production
    if (process.env.NODE_ENV === 'production' && event.error?.message?.includes('chunk')) {
      toast.error('App update available', {
        description: 'Please refresh the page',
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      });
    }
  });
}

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ErrorBoundary 
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          console.error('ErrorBoundary caught error:', error, errorInfo);
          // Here you could send error reports to monitoring services
        }}
        onReset={() => {
          // Reset any global state if needed
          window.location.reload();
        }}
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <HelmetProvider>
              <AuthProvider>
                <ThemeProvider>
                  <SubscriptionProvider>
                    <UserSettingsProvider>
                      <ExerciseProvider>
                        <DirectoryProvider>
                          <VocabularyProvider>
                            <TooltipProvider>
                              <Toaster 
                                position="top-right"
                                expand={true}
                                richColors={true}
                                closeButton={true}
                                toastOptions={{
                                  style: {
                                    background: 'var(--background)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--foreground)',
                                  },
                                  className: 'backdrop-blur-sm',
                                }}
                              />
                              <GTMTracker>
                                <div className="min-h-screen flex flex-col">
                                  <Routes>
                                    {/* Public Routes */}
                                    <Route path="/" element={<Index />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/language-selection" element={<LanguageSelectionPage />} />
                                    <Route path="/signup" element={<SignUpPage />} />
                                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                    <Route path="/terms-of-service" element={<TermsOfService />} />
                                    <Route path="/cookie-policy" element={<CookiePolicy />} />
                                    
                                    {/* Public Blog Routes */}
                                    <Route path="/blog" element={<BlogPage />} />
                                    <Route path="/blog/:slug" element={<BlogPostPage />} />
                                    
                                    {/* Protected Routes - Regular User Access */}
                                    <Route element={<ProtectedRoute />}>
                                      <Route path="/dashboard" element={<Layout />}>
                                        <Route index element={<HomePage />} />
                                        <Route path="exercises" element={<ExercisesPage />} />
                                        <Route path="curriculum" element={<CurriculumPage />} />
                                        <Route path="vocabulary" element={<VocabularyPage />} />
                                        <Route path="settings" element={<SettingsPage />} />
                                        <Route path="subscription" element={<SubscriptionPage />} />
                                        <Route path="tutorial" element={<TutorialPage />} />
                                      </Route>
                                    </Route>
                                    
                                    {/* Protected Routes - Admin Only */}
                                    <Route element={<ProtectedRoute requireAdmin={true} />}>
                                      <Route path="/dashboard" element={<Layout />}>
                                        <Route path="admin" element={<AdminPage />} />
                                        <Route path="admin/blog/new" element={<BlogPostEditor />} />
                                        <Route path="admin/blog/edit/:id" element={<BlogPostEditor />} />
                                      </Route>
                                    </Route>
                                    
                                    <Route path="*" element={<NotFound />} />
                                  </Routes>
                                </div>
                              </GTMTracker>
                            </TooltipProvider>
                          </VocabularyProvider>
                        </DirectoryProvider>
                      </ExerciseProvider>
                    </UserSettingsProvider>
                  </SubscriptionProvider>
                </ThemeProvider>
              </AuthProvider>
            </HelmetProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;