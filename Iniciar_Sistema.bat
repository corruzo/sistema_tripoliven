@echo off
cd /d "%~dp0"
title Sistema Tripoliven - Gestor de Inicio Automatico
color 0B
echo ===============================================================================
echo            SISTEMA LOGISTICO Y DE GESTION TRIPOLIVEN - INICIO
echo ===============================================================================
echo.

:: Comprobar si Node.js esta instalado en el equipo
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR CRITICO] Node.js no se encuentra instalado en este equipo.
    echo Por favor descarga e instala Node.js LTS desde https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Comprobar si las dependencias raiz ya fueron instaladas
if not exist "node_modules" (
    echo [INFO] Primera ejecucion detectada en este equipo.
    echo [INFO] Instalando dependencias globales y modulos - esto solo tomara un momento...
    call npm run install:all
    echo.
    echo [EXITO] Dependencias instaladas correctamente.
    echo ===============================================================================
)

echo [INFO] Iniciando Servidor Backend (Base de Datos) y Aplicacion Escritorio...
echo [INFO] La ventana de la aplicacion se abrira en unos segundos.
echo.
call npm start
