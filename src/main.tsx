import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Monkeypatch alert and confirm to prevent iframe/sandboxing/iOS crashes
try {
  if (typeof window !== 'undefined') {
    const originalAlert = window.alert;
    window.alert = function (message) {
      try {
        originalAlert(message);
      } catch (e) {
        console.warn('Native alert failed/blocked in sandbox, logging instead:', message, e);
      }
    };

    const originalConfirm = window.confirm;
    window.confirm = function (message) {
      try {
        return originalConfirm(message);
      } catch (e) {
        console.warn('Native confirm failed/blocked in sandbox, defaulting to true:', message, e);
        return true; // Default to OK/true so user flows can continue
      }
    };
  }
} catch (e) {
  console.warn('Failed to apply alert/confirm monkeypatches:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
