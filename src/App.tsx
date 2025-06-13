
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
import { toast } from 'sonner';
import React, { Component, ReactNode } from 'react';

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

// Custom Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // Log to external service if needed
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: any) => {
    // Log error details for monitoring
    console.error('Critical error logged:', {
      message: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetError} />;
    }
    return this.props.children;
  }
}

// Enhanced Error Fallback Component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const getErrorInfo = (error: Error) => {
    const message = error.message.toLowerCase();
    
    // Enhanced third-party service detection
    if (message.includes('supabase') || 
        message.includes('database') || 
        error.name === 'PostgrestError' ||
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('503') ||
        message.includes('502') ||
        message.includes('504')) {
      return {
        title: 'Service Temporarily Unavailable',
        description: 'We\'re currently experiencing issues with a third-party service provider. We\'re working on it — nothing will be lost, and we\'ll be back shortly.',
        icon: '🔧',
        color: 'text-blue-600 dark:text-blue-400',
        isThirdParty: true
      };
    }
    
    if (message.includes('network') || 
        message.includes('fetch') || 
        message.includes('failed to fetch') ||
        message.includes('offline') ||
        !navigator.onLine) {
      return {
        title: 'Connection Issue',
        description: 'A third-party system is temporarily unavailable. Your data is safe and we\'re resolving it.',
        icon: '🌐',
        color: 'text-amber-600 dark:text-amber-400',
        isThirdParty: true
      };
    }
    
    if (message.includes('auth') || 
        message.includes('token') || 
        message.includes('unauthorized') ||
        message.includes('401') ||
        message.includes('403')) {
      return {
        title: 'Authentication Service Issue',
        description: 'We\'re unable to connect to our authentication service provider. We\'re on it — everything will be restored soon.',
        icon: '🔐',
        color: 'text-purple-600 dark:text-purple-400',
        isThirdParty: true
      };
    }
    
    return {
      title: 'Something Went Wrong',
      description: 'We encountered an unexpected issue. Our team has been notified and is working on a fix.',
      icon: '⚠️',
      color: 'text-red-600 dark:text-red-400',
      isThirdParty: false
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-8 text-center">
            <div className="text-5xl mb-4">{errorInfo.icon}</div>
            <h1 className={`text-2xl font-bold ${errorInfo.color} mb-3`}>
              {errorInfo.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed max-w-lg mx-auto">
              {errorInfo.description}
            </p>
          </div>
          
          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Support Information */}
            {errorInfo.isThirdParty && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">💬</div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Need Help?
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                      For urgent matters or if this issue persists, please contact our support team:
                    </p>
                    <a 
                      href="mailto:support@lwlnow.com"
                      className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <span>📧</span>
                      <span>support@lwlnow.com</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
            
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
            
            {/* Status Indicator */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Monitoring service status...</span>
              </div>
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
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations for auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 1;
      },
    }
  }
});

// Enhanced global error handlers with user-friendly messaging
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
    
    const error = event.reason;
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('supabase') || 
        message.includes('database') || 
        message.includes('connection') ||
        message.includes('timeout')) {
      toast.error('Service temporarily unavailable', {
        description: 'We\'re experiencing issues with a service provider. Your data is safe and we\'re working on it.',
        duration: 6000,
        action: {
          label: 'Contact Support',
          onClick: () => window.open('mailto:support@lwlnow.com', '_blank')
        }
      });
    } else if (message.includes('network') || 
               message.includes('fetch') || 
               !navigator.onLine) {
      toast.error('Connection issue detected', {
        description: 'A third-party system is temporarily unavailable. We\'re resolving it.',
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      });
    } else {
      toast.error('Something went wrong', {
        description: 'We encountered an issue and our team has been notified.',
        duration: 4000
      });
    }
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    const error = event.error;
    const message = error?.message?.toLowerCase() || '';
    
    // Only show notifications for critical errors in production
    if (process.env.NODE_ENV === 'production') {
      if (message.includes('chunk') || message.includes('loading')) {
        toast.error('App update available', {
          description: 'Please refresh the page to get the latest version',
          duration: 8000,
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload()
          }
        });
      } else if (message.includes('supabase') || 
                 message.includes('network') || 
                 message.includes('service')) {
        toast.error('Service issue detected', {
          description: 'We\'re experiencing technical difficulties. Please try again.',
          duration: 6000,
          action: {
            label: 'Contact Support',
            onClick: () => window.open('mailto:support@lwlnow.com', '_blank')
          }
        });
      }
    }
  });

  // Network status monitoring
  window.addEventListener('online', () => {
    toast.success('Connection restored', {
      description: 'You\'re back online! Services should work normally now.',
      duration: 3000
    });
  });

  window.addEventListener('offline', () => {
    toast.error('You\'re offline', {
      description: 'Some features may not work until your connection is restored.',
      duration: 5000
    });
  });
}

// Enhanced error handling for React Query
const handleQueryError = (error: any) => {
  console.error('Query error:', error);
  
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status;
  
  if (message.includes('fetch') || 
      message.includes('network') || 
      status >= 500) {
    toast.error('Service connection issue', {
      description: 'We\'re unable to connect to a service provider. We\'re on it — everything will be restored soon.',
      duration: 6000,
      action: {
        label: 'Contact Support',
        onClick: () => window.open('mailto:support@lwlnow.com', '_blank')
      }
    });
  } else if (status === 401) {
    toast.error('Session expired', {
      description: 'Please log in again to continue',
      duration: 4000
    });
  } else if (message.includes('supabase') || 
             message.includes('database')) {
    toast.error('Database service issue', {
      description: 'We\'re experiencing issues with our database provider. Your data is safe and we\'re working on it.',
      duration: 6000,
      action: {
        label: 'Support',
        onClick: () => window.open('mailto:support@lwlnow.com', '_blank')
      }
    });
  }
};

const handleMutationError = (error: any) => {
  console.error('Mutation error:', error);
  
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status;
  
  if (message.includes('supabase') || 
      message.includes('database') || 
      status >= 500) {
    toast.error('Failed to save changes', {
      description: 'We\'re experiencing issues with a service provider. Your data is safe and we\'re working on it.',
      duration: 6000,
      action: {
        label: 'Contact Support',
        onClick: () => window.open('mailto:support@lwlnow.com', '_blank')
      }
    });
  } else if (status === 401) {
    toast.error('Authentication required', {
      description: 'Please log in again to continue',
      duration: 4000
    });
  } else if (status === 403) {
    toast.error('Permission denied', {
      description: 'You don\'t have access to this action',
      duration: 4000
    });
  } else {
    toast.error('Operation failed', {
      description: 'We encountered an issue. Our team has been notified.',
      duration: 4000,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    });
  }
};

// Set up query cache event listeners for global error handling
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'observerResultsUpdated') {
    const { query } = event;
    if (query.state.error) {
      handleQueryError(query.state.error);
    }
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.mutation?.state.error) {
    handleMutationError(event.mutation.state.error);
  }
});

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ErrorBoundary>
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
                                position="bottom-right"
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
