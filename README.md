# 🚛 Sistema de Gestión Logística y de Despachos — Tripoliven

![Tripoliven Banner](https://img.shields.io/badge/Estado-Producci%C3%B3n%20Activa-10b981?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-Desktop%20App-3b82f6?style=for-the-badge&logo=electron)
![SQLite](https://img.shields.io/badge/SQLite-Autocontenido-003B57?style=for-the-badge&logo=sqlite)

Plataforma corporativa de alta eficiencia y diseño *glassmorphism* para la gestión, seguimiento, auditoría y análisis en tiempo real de operaciones de despacho logístico.

---

## 🚀 Guía Exacta de Instalación y Configuración

Esta guía te explica el paso a paso exacto para descargar, instalar y poner en marcha el **Sistema Logístico Tripoliven** en cualquier computadora con Windows, macOS o Linux desde GitHub.

### 📦 Requisitos Previos

1. **Node.js**: Asegúrate de tener instalado Node.js (se recomienda la versión **v20 LTS** o superior). Puedes descargarlo gratuitamente desde [nodejs.org](https://nodejs.org/).
2. **Git**: Tener instalado Git para poder clonar el repositorio. [git-scm.com](https://git-scm.com/).

---

### 🛠️ Paso 1: Descargar (Clonar) el Proyecto desde GitHub

Abre tu terminal (PowerShell, CMD o Git Bash) en la carpeta donde desees alojar el sistema (por ejemplo, tu Escritorio) y ejecuta:

```powershell
git clone https://github.com/corruzo/sistema_tripoliven.git
cd sistema_tripoliven
```

*(Reemplaza `TU_USUARIO` por tu usuario real de GitHub o la URL del repositorio).*

---

### ⚙️ Paso 2: Instalación de Dependencias (Un Solo Comando)

Gracias a la automatización incorporada, solo necesitas ejecutar un comando para que se instalen las dependencias del servidor backend, del cliente desktop y del gestor simultáneo:

```powershell
npm run install:all
```

*(Este comando ingresa automáticamente a la carpeta `server` e instala las librerías de SQLite/Express, y luego ingresa a la carpeta `client` para instalar React, Vite y Electron).*

---

### 🖥️ Paso 3: Iniciar el Sistema (Modo Acceso Directo)

Para tu comodidad en el día a día, en Windows no necesitas abrir la terminal. 
Simplemente haz **doble clic** sobre el archivo:
📁 `Iniciar_Sistema.bat`

El sistema verificará automáticamente las dependencias, arrancará el servidor backend de base de datos e iniciará de forma fluida la aplicación corporativa de escritorio.

### Si prefieres usar la terminal:
```powershell
npm start
```

---

## 🗄️ Arquitectura y Datos Logísticos

* **Base de Datos Autocontenida:** Todos los registros, analíticas, clientes y usuarios se guardan automáticamente en el archivo `server/database.sqlite`.
* **Copia de Seguridad Rápida:** Para hacer un respaldo de toda la empresa, simplemente haz una copia de ese archivo `database.sqlite` en una nube o unidad externa.
