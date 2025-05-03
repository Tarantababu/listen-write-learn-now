
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create root and render app
const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

// Set initial scroll position to top
window.scrollTo(0, 0);

root.render(<App />);
