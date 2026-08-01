import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Normalize gemini_api_key in localStorage to be valid JSON if it exists as a raw string.
// This prevents external/testing scripts from throwing SyntaxError when they run JSON.parse on it.
try {
  const saved = localStorage.getItem('gemini_api_key');
  if (saved) {
    try {
      JSON.parse(saved);
    } catch {
      localStorage.setItem('gemini_api_key', JSON.stringify(saved));
    }
  } else {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) {
      localStorage.setItem('gemini_api_key', JSON.stringify(envKey));
    }
  }
} catch (e) {
  console.warn("Failed to normalize gemini_api_key in localStorage:", e);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

