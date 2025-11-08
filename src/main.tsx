import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { smsScheduler } from './lib/scheduler';

// Expose scheduler to the window
(window as any).smsScheduler = smsScheduler;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
