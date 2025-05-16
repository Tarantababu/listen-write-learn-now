
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ExerciseProvider } from './contexts/ExerciseContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { VocabularyProvider } from './contexts/VocabularyContext';

function App() {
  return (
    <AuthProvider>
      <UserSettingsProvider>
        <SubscriptionProvider>
          <VocabularyProvider>
            <ExerciseProvider>
              <ThemeProvider>
                <RouterProvider router={router} />
                <Toaster />
              </ThemeProvider>
            </ExerciseProvider>
          </VocabularyProvider>
        </SubscriptionProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
}

export default App;
