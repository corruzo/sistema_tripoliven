import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'

// Blindaje contra errores de red / promesas no capturadas silenciosas
window.addEventListener('unhandledrejection', (event) => {
  console.error('⚠️ Promesa no capturada detectada:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
