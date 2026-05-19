# Dockerfile para el servidor Backend (Express + SQLite)
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias necesarias para compilar SQLite3 si es necesario (alpine tools)
RUN apk add --no-cache python3 make g++ 

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --omit=dev

# Recompilar sqlite3 en el entorno alpine
RUN npm rebuild sqlite3

# Copiar el código del backend
COPY . .

# Exponer el puerto del servidor
EXPOSE 4000

# Comando para iniciar en modo producción
ENV NODE_ENV=production
CMD ["npm", "start"]
