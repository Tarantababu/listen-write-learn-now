
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { VocabularyProvider } from './contexts/VocabularyContext'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <SubscriptionProvider>
        <ThemeProvider>
          <VocabularyProvider>
            <App />
          </VocabularyProvider>
        </ThemeProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </BrowserRouter>
);
