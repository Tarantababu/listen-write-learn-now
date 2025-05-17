
import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardLayout from '@/components/DashboardLayout';
import HomePage from '@/pages/HomePage';
import ExercisesPage from '@/pages/ExercisesPage';
import ExercisePage from '@/pages/ExercisePage';
import DictationPage from '@/pages/DictationPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import NotFoundPage from '@/pages/NotFoundPage';
import DefaultExercisesPage from '@/pages/DefaultExercisesPage';
import VocabularyPage from '@/pages/VocabularyPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserSettingsProvider } from '@/contexts/UserSettingsContext';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { VocabularyProvider } from '@/contexts/VocabularyContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import LoadingScreen from '@/components/LoadingScreen';

function App() {
  return (
    <AuthProvider>
      <UserSettingsProvider>
        <ThemeProvider>
          <SubscriptionProvider>
            <VocabularyProvider>
              <ExerciseProvider>
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<HomePage />} />
                      <Route path="login" element={<LoginPage />} />
                      <Route path="register" element={<RegisterPage />} />
                      <Route path="forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="reset-password" element={<ResetPasswordPage />} />
                    </Route>
                    
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<HomePage />} />
                      <Route path="exercises" element={<ExercisesPage />} />
                      <Route path="default-exercises" element={<DefaultExercisesPage />} />
                      <Route path="dictation" element={<DictationPage />} />
                      <Route path="vocabulary" element={<VocabularyPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    <Route path="/exercise/:id" element={
                      <ProtectedRoute>
                        <ExercisePage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    } />

                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
                <Toaster />
              </ExerciseProvider>
            </VocabularyProvider>
          </SubscriptionProvider>
        </ThemeProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
}

export default App;
