import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { registerSW } from 'virtual:pwa-register';

import { HashRouter } from 'react-router-dom';

// Register service worker
registerSW({ immediate: true });

// Prevent benign development server WebSocket reconnect/close rejections from crashing or overlaying the application
if (typeof window !== 'undefined') {
  const handleBenignError = (message?: string) => {
    return (
      message && (
        message.includes('WebSocket') ||
        message.includes('websocket') ||
        message.includes('WS') ||
        message.includes('closed without opened')
      )
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = (reason && typeof reason === 'object' && 'message' in reason) 
      ? (reason as any).message 
      : String(reason);
      
    if (handleBenignError(msg)) {
      event.preventDefault();
      console.debug('Suppressed development server WebSocket rejection:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    if (handleBenignError(event.message)) {
      event.preventDefault();
      console.debug('Suppressed development server WebSocket error:', event.message);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
