
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from './contexts/AuthContext.tsx'
// Remove the CurriculumProvider import since it's used in the App component

createRoot(document.getElementById("root")!).render(
  <>
    <AuthProvider>
      <App />
    </AuthProvider>
    <Toaster />
  </>
);
