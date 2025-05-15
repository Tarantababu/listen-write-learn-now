
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/hooks/use-toast"
import { Toaster as SonnerToaster } from "sonner"

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <>
      <App />
      <Toaster />
      <SonnerToaster position="bottom-right" />
    </>
  </BrowserRouter>
);
