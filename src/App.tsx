
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserSettingsProvider } from '@/contexts/UserSettingsContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { VocabularyProvider } from '@/contexts/VocabularyContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import HomePage from '@/pages/HomePage';
import ExercisesPage from '@/pages/ExercisesPage';
import VocabularyPage from '@/pages/VocabularyPage';
import SettingsPage from '@/pages/SettingsPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import AdminPage from '@/pages/AdminPage';
import CurriculumPage from '@/pages/CurriculumPage';
import RoadmapPage from '@/pages/RoadmapPage';
import BidirectionalPage from '@/pages/BidirectionalPage';
import BidirectionalExercises from '@/pages/BidirectionalExercises';
import { SentenceMiningPage } from '@/pages/SentenceMiningPage';
import TutorialPage from '@/pages/TutorialPage';
import LanguageSelectionPage from '@/pages/LanguageSelectionPage';
import NotFound from '@/pages/NotFound';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import CookiePolicy from '@/pages/CookiePolicy';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <UserSettingsProvider>
                <SubscriptionProvider>
                  <VocabularyProvider>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignUpPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/cookies" element={<CookiePolicy />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogPostPage />} />

                      {/* Protected routes */}
                      <Route path="/dashboard" element={<Layout />}>
                        <Route index element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                        <Route path="exercises" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
                        <Route path="vocabulary" element={<ProtectedRoute><VocabularyPage /></ProtectedRoute>} />
                        <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                        <Route path="subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                        <Route path="admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                        <Route path="curriculum" element={<ProtectedRoute><CurriculumPage /></ProtectedRoute>} />
                        <Route path="roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
                        <Route path="bidirectional" element={<ProtectedRoute><BidirectionalPage /></ProtectedRoute>} />
                        <Route path="bidirectional-exercises" element={<ProtectedRoute><BidirectionalExercises /></ProtectedRoute>} />
                        <Route path="sentence-mining" element={<ProtectedRoute><SentenceMiningPage /></ProtectedRoute>} />
                        <Route path="tutorial" element={<ProtectedRoute><TutorialPage /></ProtectedRoute>} />
                        <Route path="language-selection" element={<ProtectedRoute><LanguageSelectionPage /></ProtectedRoute>} />
                      </Route>

                      {/* Fallback */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster />
                  </VocabularyProvider>
                </SubscriptionProvider>
              </UserSettingsProvider>
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
