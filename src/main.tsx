
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create root and render app
const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

// Set initial scroll position to top
window.scrollTo(0, 0);

// Add Inter and Fira Code fonts
const interFont = document.createElement('link');
interFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
interFont.rel = 'stylesheet';
document.head.appendChild(interFont);

const firaCodeFont = document.createElement('link');
firaCodeFont.href = 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap';
firaCodeFont.rel = 'stylesheet';
document.head.appendChild(firaCodeFont);

// Add favicon with absolute path
const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.href = '/src/assets/lwlnow-favicon.svg';
favicon.type = 'image/svg+xml';
document.head.appendChild(favicon);

root.render(<App />);
