// Configuración global de la API para Tripoliven S.A.
// Permite que hasta 100+ dispositivos en la misma red local (LAN) accedan al servidor automáticamente.

const getApiBaseUrl = () => {
  // Si se accede desde un navegador web por red local (IP del servidor)
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.hostname &&
    window.location.protocol !== 'file:'
  ) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // El servidor backend corre en el puerto 4000 por defecto
    return `${protocol}//${hostname}:4000`;
  }
  
  // Resguardo local para desarrollo o ejecución nativa local en Electron
  return 'http://localhost:4000';
};

export const API_BASE_URL = getApiBaseUrl();
