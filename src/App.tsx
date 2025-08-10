
import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Index from '@/pages/Index';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import HomePage from '@/pages/HomePage';
import ExercisesPage from '@/pages/ExercisesPage';
import BidirectionalPage from '@/pages/BidirectionalPage';
import BidirectionalExercises from '@/pages/BidirectionalExercises';
import { SentenceMiningPage } from '@/pages/SentenceMiningPage';
import VocabularyPage from '@/pages/VocabularyPage';
import SettingsPage from '@/pages/SettingsPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import CurriculumPage from '@/pages/CurriculumPage';
import RoadmapPage from '@/pages/RoadmapPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import TutorialPage from '@/pages/TutorialPage';
import AdminPage from '@/pages/AdminPage';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import CookiePolicy from '@/pages/CookiePolicy';
import NotFound from '@/pages/NotFound';
import LanguageSelectionPage from '@/pages/LanguageSelectionPage';
import { Header } from '@/components/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { UserSettingsProvider } from '@/contexts/UserSettingsContext';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { VocabularyProvider } from '@/contexts/VocabularyContext';
import { DirectoryProvider } from '@/contexts/DirectoryContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PromotionalBanner } from '@/components/PromotionalBanner';
import { trackPageView } from '@/utils/visitorTracking';
import { useSecurityMonitoring } from '@/components/admin/EnhancedSecurityHooks';
import { AnticipationPage } from '@/pages/AnticipationPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function SecurityMonitoringWrapper({ children }: { children: React.ReactNode }) {
  useSecurityMonitoring();
  return <>{children}</>;
}

function AppContent() {
  useEffect(() => {
    // Initial page load tracking
    trackPageView(window.location.pathname);
  }, []);

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <UserSettingsProvider>
          <ExerciseProvider>
            <VocabularyProvider>
              <DirectoryProvider>
                <SecurityMonitoringWrapper>
                  <ScrollToTop />
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <PromotionalBanner />
                    <main className="flex-grow">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/language-selection" element={<LanguageSelectionPage />} />
                        
                        {/* Protected Routes */}
                        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                        <Route path="/exercises" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
                        <Route path="/bidirectional" element={<ProtectedRoute><BidirectionalPage /></ProtectedRoute>} />
                        <Route path="/bidirectional-exercises" element={<ProtectedRoute><BidirectionalExercises /></ProtectedRoute>} />
                        <Route path="/sentence-mining" element={<ProtectedRoute><SentenceMiningPage /></ProtectedRoute>} />
                        <Route path="/anticipation" element={<ProtectedRoute><AnticipationPage /></ProtectedRoute>} />
                        <Route path="/vocabulary" element={<ProtectedRoute><VocabularyPage /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                        <Route path="/curriculum" element={<ProtectedRoute><CurriculumPage /></ProtectedRoute>} />
                        <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
                        <Route path="/blog" element={<BlogPage />} />
                        <Route path="/blog/:slug" element={<BlogPostPage />} />
                        <Route path="/tutorial" element={<ProtectedRoute><TutorialPage /></ProtectedRoute>} />
                        
                        {/* Admin Routes */}
                        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                        
                        {/* Legal Pages */}
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/cookie-policy" element={<CookiePolicy />} />
                        
                        {/* Catch all route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </SecurityMonitoringWrapper>
              </DirectoryProvider>
            </VocabularyProvider>
          </ExerciseProvider>
        </UserSettingsProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
