
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster"
import { CurriculumProvider } from './contexts/CurriculumContext.tsx'

createRoot(document.getElementById("root")!).render(
  <>
    <CurriculumProvider>
      <App />
    </CurriculumProvider>
    <Toaster />
  </>
);
