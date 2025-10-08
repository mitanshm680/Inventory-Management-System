import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppModeProvider } from './contexts/AppModeContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <AppModeProvider>
          <App />
        </AppModeProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals(); 