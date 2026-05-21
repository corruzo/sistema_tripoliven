# Dockerfile para el servidor Backend (Express + SQLite)
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Instalar postgresql-client (provee pg_dump, pg_restore, psql)
RUN apk add --no-cache postgresql-client

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --omit=dev

# Copiar el código del backend
COPY . .

# Exponer el puerto del servidor
EXPOSE 4000

# Comando para iniciar en modo producción
ENV NODE_ENV=production
CMD ["npm", "start"]
