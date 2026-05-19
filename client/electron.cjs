const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 1024,
        minHeight: 768,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f172a',
            symbolColor: '#ffffff',
            height: 44
        },
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
}

ipcMain.on('set-theme', (event, theme) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && win.setTitleBarOverlay) {
        if (theme === 'light') {
            win.setTitleBarOverlay({
                color: '#f1f5f9', // Fondo gris hielo modo claro
                symbolColor: '#0f172a' // Iconos oscuros
            });
        } else {
            win.setTitleBarOverlay({
                color: '#0f172a', // Fondo oscuro modo oscuro
                symbolColor: '#ffffff' // Iconos blancos
            });
        }
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
