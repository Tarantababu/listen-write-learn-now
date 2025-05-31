
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import Index from '@/pages/Index';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';
import ExercisesPage from '@/pages/ExercisesPage';
import VocabularyPage from '@/pages/VocabularyPage';
import CurriculumPage from '@/pages/CurriculumPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import TutorialPage from '@/pages/TutorialPage';
import NotFound from '@/pages/NotFound';
import '@/index.css';
import { generateAndSaveSitemap } from '@/utils/generateSitemap';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Check for ad blockers
    const adBlockEnabled = false; // Replace with actual ad blocker detection logic if needed

    if (adBlockEnabled) {
      alert("Please disable your ad blocker to ensure the best experience.");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <ThemeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                
                {/* Main Layout with Header and Session Warning */}
                <Route path="/dashboard" element={<Layout />}>
                  <Route index element={<ExercisesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="subscription" element={<SubscriptionPage />} />
                  <Route path="exercises" element={<ExercisesPage />} />
                  <Route path="vocabulary" element={<VocabularyPage />} />
                  <Route path="curriculum" element={<CurriculumPage />} />
                  <Route path="tutorial" element={<TutorialPage />} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                
                {/* Catch-all route for 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
          </ThemeProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Generate sitemap on app load (development only)
if (import.meta.env.DEV) {
  generateAndSaveSitemap();
}

export default App;
