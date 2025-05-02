
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

import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import HomePage from "@/pages/HomePage";
import ExercisesPage from "@/pages/ExercisesPage";
import VocabularyPage from "@/pages/VocabularyPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const AuthenticatedApp: React.FC = () => {
  return (
    <UserSettingsProvider>
      <ExerciseProvider>
        <DirectoryProvider>
          <VocabularyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner position="top-center" />
              <div className="min-h-screen flex flex-col">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Layout />}>
                      <Route index element={<HomePage />} />
                      <Route path="exercises" element={<ExercisesPage />} />
                      <Route path="vocabulary" element={<VocabularyPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </TooltipProvider>
          </VocabularyProvider>
        </DirectoryProvider>
      </ExerciseProvider>
    </UserSettingsProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
