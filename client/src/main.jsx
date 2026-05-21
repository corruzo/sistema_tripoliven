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

// Interceptor global de fetch para inyectar cabecera JWT de forma segura
// y limpiar cabeceras obsoletas e inseguras como X-User-Id de forma transparente
const { fetch: originalFetch } = window;
window.fetch = async function (resource, init = {}) {
  const resourceUrl = resource.toString();
  
  if (resourceUrl.includes('/api/')) {
    if (!init.headers) {
      init.headers = {};
    }
    
    if (init.headers instanceof Headers) {
      init.headers.delete('X-User-Id');
      init.headers.delete('x-user-id');
      const token = localStorage.getItem('tripoliven_token');
      if (token) {
        init.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(init.headers)) {
      init.headers = init.headers.filter(h => h[0].toLowerCase() !== 'x-user-id');
      const token = localStorage.getItem('tripoliven_token');
      if (token) {
        init.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      delete init.headers['X-User-Id'];
      delete init.headers['x-user-id'];
      const token = localStorage.getItem('tripoliven_token');
      if (token) {
        init.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }
  return originalFetch(resource, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
