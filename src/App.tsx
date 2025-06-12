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
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEffect } from 'react';
import { toast } from 'sonner';

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
import BlogPage from "@/pages/BlogPage"; 
import BlogPostPage from "@/pages/BlogPostPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('JWT expired') || 
            error?.message?.includes('Supabase') ||
            error?.message?.includes('postgrest') ||
            error?.message?.includes('Network Error') ||
            error?.message?.includes('Failed to fetch') ||
            error?.code === 'ECONNABORTED') {
          return false;
        }
        return failureCount < 3;
      },
      onError: (error: any) => {
        if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
          toast.error('Connection Issue', {
            description: 'Unable to connect to our services. Please check your internet connection.',
            action: {
              label: 'Troubleshoot',
              onClick: () => window.open('/help/connection-issues', '_blank'),
            },
          });
        } 
        else if (error.message?.includes('Supabase') || error.message?.includes('postgrest')) {
          toast.error('Service Interruption', {
            description: 'Our cloud database provider is experiencing temporary issues. Data may load slowly.',
            action: {
              label: 'Status Page',
              onClick: () => window.open('https://status.supabase.com', '_blank'),
            },
          });
        }
        else if (error.response?.status >= 500) {
          toast.error('Server Busy', {
            description: 'Our servers are temporarily overloaded. Please try again in a moment.',
          });
        }
        else {
          toast.error('Loading Problem', {
            description: 'We hit a snag loading your data. Refreshing usually helps!',
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload(),
            },
          });
        }
        console.error('Query error:', error);
      },
    },
    mutations: {
      onError: (error: any) => {
        if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
          toast.error('Offline Changes', {
            description: 'Your changes will be saved when your connection returns.',
            duration: 10000,
          });
        } 
        else if (error.message?.includes('Supabase') || error.message?.includes('postgrest')) {
          toast.error('Storage Service Down', {
            description: 'Our data storage provider is currently unavailable. Changes will sync when service is restored.',
            action: {
              label: 'Learn More',
              onClick: () => window.open('/help/data-syncing', '_blank'),
            },
          });
        }
        else if (error.response?.status >= 500) {
          toast.error('Save Failed', {
            description: 'Our servers couldn\'t process your request. Please try again shortly.',
          });
        }
        else {
          toast.error('Action Not Completed', {
            description: 'We couldn\'t complete your request. Trying again usually works!',
            action: {
              label: 'Retry',
              onClick: () => window.location.reload(),
            },
          });
        }
        console.error('Mutation error:', error);
      },
    },
  },
});

function App() {
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Network Error') || 
          event.error?.message?.includes('Failed to fetch')) {
        toast.error('Offline Mode', {
          description: 'Some features are limited without internet. Your work will sync when back online.',
          duration: 15000,
          action: {
            label: 'Work Offline',
            onClick: () => window.open('/help/offline-usage', '_blank'),
          },
        });
      } 
      else if (event.error?.message?.includes('Supabase') || 
              event.error?.message?.includes('postgrest')) {
        toast.error('Cloud Service Issue', {
          description: 'Our cloud provider is experiencing problems. Core features remain available.',
          duration: 10000,
        });
      } 
      else {
        toast.error('Unexpected Glitch', {
          description: 'Something unexpected happened. Our team has been notified.',
          action: {
            label: 'Report Issue',
            onClick: () => window.open('/contact-support', '_blank'),
          },
        });
      }
      console.error('Global error:', event.error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Network Error') || 
          event.reason?.message?.includes('Failed to fetch')) {
        toast.error('Sync Failed', {
          description: 'Couldn\'t communicate with our servers. Your data is safe and will sync later.',
        });
      }
      else if (event.reason?.message?.includes('Supabase')) {
        toast.error('Dependency Issue', {
          description: 'A required cloud service is temporarily unavailable. We\'re working on it!',
          action: {
            label: 'Status Updates',
            onClick: () => window.open('/status', '_blank'),
          },
        });
      }
      console.error('Unhandled rejection:', event.reason);
    };

    const handleOnline = () => {
      toast.success('Back Online', { 
        description: 'Connection restored. Syncing your latest changes...',
        duration: 4000,
      });
    };

    const handleOffline = () => {
      toast.warning('Working Offline', { 
        description: 'You can continue working, and we\'ll sync when you\'re back online.',
        duration: 8000,
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
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
                              <Toaster position="top-center" richColors closeButton />
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
      </div>
    </ErrorBoundary>
  );
}

export default App;