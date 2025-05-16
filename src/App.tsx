
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ExerciseProvider } from './contexts/ExerciseContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <UserSettingsProvider>
        <SubscriptionProvider>
          <ExerciseProvider>
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
              <RouterProvider router={router} />
              <Toaster />
            </ThemeProvider>
          </ExerciseProvider>
        </SubscriptionProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
}

export default App;
