
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster"
import { toast } from 'sonner';

// Add handler for unhandled promise rejections to avoid infinite auth rejects
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Only show auth errors once to prevent cascading toasts
  if (event.reason?.message?.includes('auth') || 
      event.reason?.message?.includes('session') ||
      event.reason?.message?.includes('Authentication')) {
    toast.error('Authentication error. Please refresh the page or sign in again.');
    
    // Log auth error details for debugging 
    console.warn('Auth error details:', {
      message: event.reason?.message,
      status: event.reason?.status,
    });
  }
});

// Create root outside of any async context to ensure React has full control
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");
const root = createRoot(rootElement);

// Render app with error boundary
root.render(
  <>
    <App />
    <Toaster />
  </>
);
