const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Soporte de persistencia en Docker: En producción guardamos en la carpeta /database
const dbFolder = process.env.NODE_ENV === 'production' 
    ? path.resolve(__dirname, 'database') 
    : __dirname;

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

const dbPath = path.resolve(dbFolder, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        
        db.serialize(() => {
            db.run("PRAGMA foreign_keys = ON;");
            db.run("PRAGMA journal_mode = WAL;");
            db.run("PRAGMA synchronous = NORMAL;");
            db.run("PRAGMA busy_timeout = 5000;");

            // 1. Crear Tabla de Departamentos
            db.run(`CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                manager_id INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // 2. Crear Tabla de Cargos
            db.run(`CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                department_id INTEGER NOT NULL,
                description TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments (id)
            )`);

            // 3. Crear Tabla de Usuarios / Empleados
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                system_role TEXT NOT NULL DEFAULT 'Usuario',
                status TEXT NOT NULL DEFAULT 'Activo',
                position_id INTEGER,
                department_id INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (position_id) REFERENCES positions (id),
                FOREIGN KEY (department_id) REFERENCES departments (id)
            )`);

            // 4. Crear Tabla de Tipos de Producto
            db.run(`CREATE TABLE IF NOT EXISTS product_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // 5. Crear Tabla de Clientes
            db.run(`CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                rif TEXT NOT NULL UNIQUE,
                state TEXT NOT NULL,
                address TEXT,
                phone TEXT,
                contact_person TEXT,
                email TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // 6. Crear Tabla de Despachos
            db.run(`CREATE TABLE IF NOT EXISTS dispatches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                product_type TEXT NOT NULL,
                quantity_tm REAL NOT NULL,
                destination_state TEXT NOT NULL,
                dispatch_datetime TEXT NOT NULL,
                order_number TEXT UNIQUE NOT NULL,
                driver_name TEXT,
                license_plate TEXT,
                status TEXT NOT NULL DEFAULT 'Despachado',
                created_by INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients (id),
                FOREIGN KEY (created_by) REFERENCES users (id)
            )`);

            // Índices de optimización de rendimiento para consultas concurrentes de despachos
            db.run("CREATE INDEX IF NOT EXISTS idx_dispatches_dispatch_date ON dispatches(dispatch_datetime);");
            db.run("CREATE INDEX IF NOT EXISTS idx_dispatches_product_type ON dispatches(product_type);");            // 6. Semillar Datos de Departamentos, Cargos, Usuarios (Solo Administrador de Sistema)
            db.get("SELECT count(*) as count FROM departments", (err, row) => {
                if (row && row.count === 0) {
                    console.log('Migración: Inicializando departamentos y cargos...');
                    
                    db.serialize(() => {
                        // Semillar Departamento Base de TI
                        db.run("INSERT INTO departments (id, name, description) VALUES (1, 'Tecnología (TI)', 'Soporte y desarrollo de sistemas')");
 
                        // Semillar Cargo Base
                        db.run("INSERT INTO positions (id, name, department_id, description) VALUES (1, 'Jefe de Sistemas', 1, 'Líder de TI y Administrador del Sistema')");
 
                        // Semillar Usuario Administrador Maestro
                        const stmt = db.prepare("INSERT INTO users (name, email, username, password, system_role, status, position_id, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                        stmt.run('Admin OmniDispatch', 'admin@omnidispatch.com', 'admin', 'admin123', 'Administrador', 'Activo', 1, 1);
                        stmt.finalize(() => {
                            console.log('Migración: Estructura de personal cargada con éxito.');
                        });
                    });
                }
            });

            // Semillar Tipos de Producto
            db.get("SELECT count(*) as count FROM product_types", (err, row) => {
                if (row && row.count === 0) {
                    console.log('Migración: Inicializando tipos de producto...');
                    db.serialize(() => {
                        db.run("INSERT INTO product_types (name, description) VALUES ('Tripolifosfato', 'Fosfatos de sodio para la industria de detergentes y alimentos')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('Ácido Fosfórico', 'Ácidos concentrados de uso técnico y alimenticio')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('Pirofosfato', 'Sales de pirofosfato tetrasódico para emulsionantes y estabilizantes')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('Otros', 'Otros productos y subproductos industriales')");
                        console.log('Migración: Catálogo de productos inicializado.');
                    });
                }
            });
        });
    }
});

module.exports = db;
