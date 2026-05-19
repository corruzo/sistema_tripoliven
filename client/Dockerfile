# Dockerfile para la interfaz Frontend (React + Vite served via Nginx)
# Etapa 1: Construcción del estático
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor Web Nginx para distribución de alto rendimiento
FROM nginx:alpine

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración básica de Nginx para soportar React Router (Single Page App)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
