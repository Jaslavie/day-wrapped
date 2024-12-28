import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initChrome } from './utils/chromeMock';

// initialize chrome api mock if in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode detected, initializing Chrome mock');
  initChrome();
}

// Wait for DOM to be ready
window.addEventListener('load', () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
