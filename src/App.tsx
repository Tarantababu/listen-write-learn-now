
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import { ThemeProvider } from './contexts/ThemeProvider';

import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import HomePage from "@/pages/HomePage";
import ExercisesPage from "@/pages/ExercisesPage";
import VocabularyPage from "@/pages/VocabularyPage";
import SettingsPage from "@/pages/SettingsPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import AdminPage from "@/pages/AdminPage";
import TutorialPage from "@/pages/TutorialPage";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CookiePolicy from "@/pages/CookiePolicy";

const queryClient = new QueryClient();

const AuthenticatedApp: React.FC = () => {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <AuthProvider>
          <ThemeProvider>
            <UserSettingsProvider>
              <SubscriptionProvider>
                <ExerciseProvider>
                  <DirectoryProvider>
                    <VocabularyProvider>
                      <TooltipProvider>
                        <Toaster />
                        <Sonner position="bottom-right" />
                        <div className="min-h-screen flex flex-col">
                          <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<Index />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignUpPage />} />
                            <Route path="/auth-callback" element={<AuthCallbackPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="/terms-of-service" element={<TermsOfService />} />
                            <Route path="/cookie-policy" element={<CookiePolicy />} />
                            
                            {/* Protected Routes */}
                            <Route element={<ProtectedRoute />}>
                              <Route path="/dashboard" element={<Layout />}>
                                <Route index element={<HomePage />} />
                                <Route path="exercises" element={<ExercisesPage />} />
                                <Route path="vocabulary" element={<VocabularyPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                                <Route path="subscription" element={<SubscriptionPage />} />
                                <Route path="admin" element={<AdminPage />} />
                                <Route path="tutorial" element={<TutorialPage />} />
                              </Route>
                            </Route>
                            
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                      </TooltipProvider>
                    </VocabularyProvider>
                  </DirectoryProvider>
                </ExerciseProvider>
              </SubscriptionProvider>
            </UserSettingsProvider>
          </ThemeProvider>
        </AuthProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthenticatedApp />
  </QueryClientProvider>
);

export default App;
