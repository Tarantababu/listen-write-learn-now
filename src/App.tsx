
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
import { RoadmapProvider } from './features/roadmap/context/RoadmapContext';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurriculumProvider } from './contexts/CurriculumContext';
import CurriculumPage from './pages/CurriculumPage';

import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import HomePage from "@/pages/HomePage";
import ExercisesPage from "@/pages/ExercisesPage";
import VocabularyPage from "@/pages/VocabularyPage";
import RoadmapPage from "@/pages/RoadmapPage";
import SettingsPage from "@/pages/SettingsPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import AdminPage from "@/pages/AdminPage";
import TutorialPage from "@/pages/TutorialPage";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CookiePolicy from "@/pages/CookiePolicy";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <HelmetProvider>
          <AuthProvider>
            <ThemeProvider>
              <SubscriptionProvider>
                <UserSettingsProvider>
                  <RoadmapProvider>
                    <ExerciseProvider>
                      <DirectoryProvider>
                        <VocabularyProvider>
                          <CurriculumProvider>
                            <TooltipProvider>
                              <Toaster />
                              <Sonner position="bottom-right" />
                              <div className="min-h-screen flex flex-col">
                                <Routes>
                                  {/* Public Routes */}
                                  <Route path="/" element={<Index />} />
                                  <Route path="/login" element={<LoginPage />} />
                                  <Route path="/signup" element={<SignUpPage />} />
                                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                  <Route path="/terms-of-service" element={<TermsOfService />} />
                                  <Route path="/cookie-policy" element={<CookiePolicy />} />
                                  
                                  {/* Protected Routes - Regular User Access */}
                                  <Route element={<ProtectedRoute />}>
                                    <Route path="/dashboard" element={<Layout />}>
                                      <Route index element={
                                        <ErrorBoundary>
                                          <HomePage />
                                        </ErrorBoundary>
                                      } />
                                      <Route path="exercises" element={
                                        <ErrorBoundary>
                                          <ExercisesPage />
                                        </ErrorBoundary>
                                      } />
                                      <Route path="roadmap" element={
                                        <ErrorBoundary>
                                          <RoadmapPage />
                                        </ErrorBoundary>
                                      } />
                                      <Route path="vocabulary" element={
                                        <ErrorBoundary>
                                          <VocabularyPage />
                                        </ErrorBoundary>
                                      } />
                                      <Route path="settings" element={
                                        <ErrorBoundary>
                                          <SettingsPage />
                                        </ErrorBoundary>
                                      } />
                                      <Route path="subscription" element={
                                        <ErrorBoundary>
                                          <SubscriptionPage />
                                        </ErrorBoundary>
                                      } />
                                      <Route path="tutorial" element={
                                        <ErrorBoundary>
                                          <TutorialPage />
                                        </ErrorBoundary>
                                      } />
                                    </Route>
                                  </Route>
                                  
                                  {/* Protected Routes - Admin Only */}
                                  <Route element={<ProtectedRoute requireAdmin={true} />}>
                                    <Route path="/dashboard" element={<Layout />}>
                                      <Route path="admin" element={
                                        <ErrorBoundary>
                                          <AdminPage />
                                        </ErrorBoundary>
                                      } />
                                    </Route>
                                  </Route>
                                  
                                  <Route
                                    path="/dashboard/curriculum"
                                    element={
                                      <ProtectedRoute>
                                        <ErrorBoundary>
                                          <CurriculumPage />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                  
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </div>
                            </TooltipProvider>
                          </CurriculumProvider>
                        </VocabularyProvider>
                      </DirectoryProvider>
                    </ExerciseProvider>
                  </RoadmapProvider>
                </UserSettingsProvider>
              </SubscriptionProvider>
            </ThemeProvider>
          </AuthProvider>
        </HelmetProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
