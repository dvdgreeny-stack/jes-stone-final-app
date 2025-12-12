import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Update import to use './App' to resolve casing mismatch error with 'app.tsx'
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);