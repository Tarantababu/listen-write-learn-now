
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { SubscriptionProvider } from './contexts/SubscriptionContext'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <SubscriptionProvider>
      <App />
    </SubscriptionProvider>
  </BrowserRouter>
);
