import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de repuesto.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Puedes registrar el error en un servicio de reporte aquí
    console.error("ErrorBoundary capturó un error crítico:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Interfaz de repuesto premium
      return (
        <div style={{
          width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0B0F19', color: 'white', fontFamily: 'Outfit, sans-serif', padding: '20px',
          boxSizing: 'border-box'
        }}>
          {/* Glow effects */}
          <div style={{
            position: 'absolute', width: '350px', height: '350px', borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)', filter: 'blur(120px)', top: '15%', left: '15%'
          }}></div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '24px',
            padding: '40px', maxWidth: '500px', width: '100%', textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)', zIndex: 10
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 24px auto', color: '#ef4444'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 12px 0' }}>
              Oops! Algo salió mal
            </h1>
            
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              El sistema ha capturado una falla inesperada en la interfaz. No te preocupes, tus datos no han sido afectados. Puedes intentar recargar la aplicación.
            </p>

            {/* Detalles del error en ambiente de desarrollo */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px', padding: '16px', marginBottom: '32px', textAlign: 'left',
              maxHeight: '150px', overflowY: 'auto'
            }}>
              <code style={{ fontSize: '0.8rem', color: '#f87171', wordBreak: 'break-all' }}>
                {this.state.error && this.state.error.toString()}
              </code>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'var(--accent-gradient)', border: 'none', color: 'white',
                  padding: '12px 24px', borderRadius: '12px', cursor: 'pointer',
                  fontWeight: '600', fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                  gap: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                <RefreshCw size={18} /> Recargar Aplicación
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)',
                  color: 'white', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer',
                  fontWeight: '600', fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Home size={18} /> Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
