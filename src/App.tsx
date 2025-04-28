
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExerciseProvider } from "@/contexts/ExerciseContext";
import { UserSettingsProvider } from "@/contexts/UserSettingsContext";
import { VocabularyProvider } from "@/contexts/VocabularyContext";

import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import ExercisesPage from "@/pages/ExercisesPage";
import VocabularyPage from "@/pages/VocabularyPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserSettingsProvider>
      <ExerciseProvider>
        <VocabularyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="exercises" element={<ExercisesPage />} />
                  <Route path="vocabulary" element={<VocabularyPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </VocabularyProvider>
      </ExerciseProvider>
    </UserSettingsProvider>
  </QueryClientProvider>
);

export default App;
