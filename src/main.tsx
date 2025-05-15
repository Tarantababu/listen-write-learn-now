
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster"

// Remove AuthProvider since it's already included in App.tsx
createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);
