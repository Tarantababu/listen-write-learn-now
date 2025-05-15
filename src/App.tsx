import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import { UserSettingsProvider } from "./contexts/UserSettingsContext";
import { Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Header from "./components/Header";
import RequireAuth from "./components/RequireAuth";
import ExercisesPage from "./pages/ExercisesPage";
import RoadmapPage from "./pages/RoadmapPage";
import { HelmetProvider } from 'react-helmet-async';
import { CurriculumPathProvider } from './contexts/CurriculumPathContext';

function App() {
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <UserSettingsProvider>
            <CurriculumPathProvider>
              <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                <div className="min-h-screen bg-background">
                  <Header />
                  <div className="container mx-auto">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                      <Route path="/dashboard/exercises" element={<RequireAuth><ExercisesPage /></RequireAuth>} />
                      <Route path="/dashboard/roadmap" element={<RequireAuth><RoadmapPage /></RequireAuth>} />
                    </Routes>
                  </div>
                </div>
              </ThemeProvider>
            </CurriculumPathProvider>
          </UserSettingsProvider>
        </AuthProvider>
      </HelmetProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
