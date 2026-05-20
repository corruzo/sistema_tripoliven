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

            // 7. Crear Tabla de Logs de Auditoría
            db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Índices de optimización de rendimiento para consultas concurrentes y búsquedas rápidas
            db.run("CREATE INDEX IF NOT EXISTS idx_dispatches_dispatch_date ON dispatches(dispatch_datetime);");
            db.run("CREATE INDEX IF NOT EXISTS idx_dispatches_product_type ON dispatches(product_type);");
            db.run("CREATE INDEX IF NOT EXISTS idx_dispatches_client_id ON dispatches(client_id);");
            db.run("CREATE INDEX IF NOT EXISTS idx_dispatches_created_by ON dispatches(created_by);");
            db.run("CREATE INDEX IF NOT EXISTS idx_positions_department_id ON positions(department_id);");
            db.run("CREATE INDEX IF NOT EXISTS idx_users_position_id ON users(position_id);");
            db.run("CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);");
            db.run("CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);");
            db.run("CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(createdAt);");

            // 6. Semillar Datos de Departamentos, Cargos, Usuarios (Solo Administrador de Sistema)
            db.get("SELECT count(*) as count FROM departments", (err, row) => {
                if (row && row.count === 0) {
                    console.log('Migración: Inicializando departamentos y cargos...');

                    db.serialize(() => {
                        // Semillar Departamento Base de TI
                        db.run("INSERT INTO departments (id, name, description) VALUES (1, 'Sistemas y Tecnología', 'Mantenimiento, soporte y desarrollo de sistemas')");

                        // Semillar Cargo Base
                        db.run("INSERT INTO positions (id, name, department_id, description) VALUES (1, 'Analista de Sistemas', 1, '')");

                        // Semillar Usuario Administrador Maestro
                        const stmt = db.prepare("INSERT INTO users (name, email, username, password, system_role, status, position_id, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                        stmt.run('Nixon Garcia', 'nixon.garcia@tripolierp.com', 'ngarcia', 'admin', 'Administrador', 'Activo', 1, 1);
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
                        db.run("INSERT INTO product_types (name, description) VALUES ('URFOSe10 / GRANEL', 'Fertilizante líquido concentrado a base de nitrógeno y fósforo, ideal para fertirriego a gran escala')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('TRIPOLFOS P21 BB', 'Tripolifosfato de sodio en Big Bag, usado como ablandador de agua, dispersante y en detergentes')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('SULFATO DE CALCIO ESTANDAR', 'Enmienda mineral en polvo para suelos; aporta calcio y azufre, mejorando su estructura')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('YESO INDUSTRIAL', 'Yeso calcinado de alta pureza para la fabricación de moldes, cerámicas y estucos')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('URFOSe10 / SAC25, PS', 'Fertilizante soluble con nitrógeno y fósforo en sacos de 25 kg para fácil dosificación')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('SULFATO DE CALCIO GRANULADO 5N / GRANEL', 'Sulfato de calcio de alta pureza en formato granulado a granel para aplicación homogénea')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('SUPERFOSVEN 20 / Granel', 'Fertilizante fosfatado simple a granel con 20% de fósforo, ideal para desarrollo radicular')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('SULFATO DE CALCIO GRANULADO 32-16 GRANEL', 'Formulación granulada específica a granel para la nutrición vegetal y corrección de suelos')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('SULFATO DE CALCIO 3H', 'Sulfato de calcio con grado específico de hidratación para uso industrial o agrícola')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('Sulfato de Calcio 3H (A)', 'Variante A de sulfato de calcio 3H con especificaciones técnicas particulares')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('Sulfato de Calcio 3H (B)', 'Variante B de sulfato de calcio 3H con especificaciones técnicas particulares')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('SULFATO DE CALCIO 1H', 'Sulfato de calcio parcialmente deshidratado para aplicaciones industriales y químicas')");
                        db.run("INSERT INTO product_types (name, description) VALUES ('YESO CEM-90', 'Yeso formulado especialmente como aditivo regulador del tiempo de fraguado en el cemento')");
                        console.log('Migración: Catálogo de productos inicializado.');
                    });
                }
            });

            // Semillar Clientes y Despachos de Ejemplo basados en datos reales
            db.get("SELECT count(*) as count FROM clients", (err, row) => {
                if (row && row.count === 0) {
                    console.log('Migración: Inicializando clientes de ejemplo...');
                    db.serialize(() => {
                        const stmtClient = db.prepare("INSERT INTO clients (id, name, rif, state, address, phone, contact_person, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                        stmtClient.run(1, 'Colgate-Palmolive C.A.', 'J-00050471-0', 'Carabobo', 'Av. Henry Ford, Zona Industrial Sur, Valencia', '0241-8742111', 'Marcos Silva', 'compras@colgate.com.ve');
                        stmtClient.run(2, 'Procter & Gamble de Venezuela', 'J-00100538-6', 'Miranda', 'Av. Principal de la Trinidad, Edif. P&G, Caracas', '0212-9035111', 'Andrea Restrepo', 'logistica.ve@pg.com');
                        stmtClient.run(3, 'Alimentos Polar Comercial C.A.', 'J-00041312-6', 'Carabobo', 'Calle Salvador Feo La Cruz, Valencia', '0241-8391111', 'Carlos Eduardo', 'despacho@alimentospolar.com');
                        stmtClient.run(4, 'Detergentes y Jabones de Venezuela (DETEVEN)', 'J-30113813-0', 'Aragua', 'Zona Industrial Cagua, Cagua', '0244-3958822', 'Luisa Ortega', 'recepcion@deteven.com');
                        stmtClient.finalize(() => {
                            console.log('Migración: Clientes de ejemplo inicializados.');
                            seedDispatches();
                        });
                    });
                } else {
                    seedDispatches();
                }
            });

            function seedDispatches() {
                db.get("SELECT count(*) as count FROM dispatches", (err, row) => {
                    if (row && row.count === 0) {
                        console.log('Migración: Inicializando despachos de ejemplo...');
                        db.serialize(() => {
                            const stmtDispatch = db.prepare(`
                                INSERT INTO dispatches (
                                    client_id, product_type, quantity_tm, destination_state, 
                                    dispatch_datetime, order_number, driver_name, license_plate, 
                                    status, created_by
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `);

                            stmtDispatch.run(1, 'TRIPOLFOS P21 BB', 30.0, 'Carabobo', '2026-05-18 08:30:00', 'PED-150346', 'José Gregorio Rodriguez', 'A30CG8D', 'Despachado', 1);
                            stmtDispatch.run(1, 'YESO CEM-90', 15.5, 'Carabobo', '2026-05-19 14:15:00', 'PED-150347', 'Luis Alonzo Torres', 'A41BH9E', 'Despachado', 1);
                            stmtDispatch.run(2, 'TRIPOLFOS P21 BB', 24.0, 'Miranda', '2026-05-18 10:45:00', 'PED-150348', 'Carlos Alberto Mendoza', 'A12B34C', 'Despachado', 1);
                            stmtDispatch.run(2, 'SULFATO DE CALCIO ESTANDAR', 28.0, 'Miranda', '2026-05-20 09:00:00', 'PED-150349', 'Francisco Javier Castillo', 'A88DD3F', 'Despachado', 1);
                            stmtDispatch.run(3, 'URFOSe10 / GRANEL', 32.5, 'Carabobo', '2026-05-19 11:20:00', 'PED-150350', 'Juan Ramón Gómez', 'A52CL2M', 'Despachado', 1);
                            stmtDispatch.run(3, 'SUPERFOSVEN 20 / Granel', 26.8, 'Yaracuy', '2026-05-20 07:30:00', 'PED-150351', 'Miguel Angel Rivas', 'A61EK4R', 'Despachado', 1);
                            stmtDispatch.run(4, 'TRIPOLFOS P21 BB', 25.0, 'Aragua', '2026-05-19 15:40:00', 'PED-150352', 'Pedro José Escalona', 'A04FG9T', 'Despachado', 1);
                            stmtDispatch.run(1, 'TRIPOLFOS P21 BB', 30.0, 'Carabobo', '2026-05-18 08:30:00', 'PED-150346', 'José Gregorio Rodriguez', 'A30CG8D', 'Despachado', 1);
                            stmtDispatch.run(1, 'YESO CEM-90', 15.5, 'Carabobo', '2026-05-19 14:15:00', 'PED-150347', 'Luis Alonzo Torres', 'A41BH9E', 'Despachado', 1);
                            stmtDispatch.run(2, 'TRIPOLFOS P21 BB', 24.0, 'Miranda', '2026-05-18 10:45:00', 'PED-150348', 'Carlos Alberto Mendoza', 'A12B34C', 'Despachado', 1);
                            stmtDispatch.run(2, 'SULFATO DE CALCIO ESTANDAR', 28.0, 'Miranda', '2026-05-20 09:00:00', 'PED-150349', 'Francisco Javier Castillo', 'A88DD3F', 'Despachado', 1);
                            stmtDispatch.run(3, 'URFOSe10 / GRANEL', 32.5, 'Carabobo', '2026-05-19 11:20:00', 'PED-150350', 'Juan Ramón Gómez', 'A52CL2M', 'Despachado', 1);
                            stmtDispatch.run(3, 'SUPERFOSVEN 20 / Granel', 26.8, 'Yaracuy', '2026-05-20 07:30:00', 'PED-150351', 'Miguel Angel Rivas', 'A61EK4R', 'Despachado', 1);
                            stmtDispatch.run(4, 'TRIPOLFOS P21 BB', 25.0, 'Aragua', '2026-05-19 15:40:00', 'PED-150352', 'Pedro José Escalona', 'A04FG9T', 'Despachado', 1);
                            stmtDispatch.run(4, 'SULFATO DE CALCIO ESTANDAR', 18.2, 'Aragua', '2026-05-20 11:15:00', 'PED-150353', 'Ramón Eduardo Delgado', 'A92BT5Y', 'Despachado', 1);
                            stmtDispatch.finalize((err) => {
                                if (err) {
                                    console.error('Error al semillar despachos de ejemplo:', err.message);
                                } else {
                                    console.log('Migración: Despachos de ejemplo inicializados con éxito.');
                                }
                            });
                        });
                    }
                });
            }
        });
    }
});

db.logAudit = (userId, action, details, ipAddress) => {
    return new Promise((resolve) => {
        db.run(
            `INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`,
            [userId || null, action, details || null, ipAddress || null],
            (err) => {
                if (err) {
                    console.error('[AUDITORÍA] Error al registrar log de auditoría:', err.message);
                }
                resolve(); // Resolver siempre de forma defensiva para evitar bloquear la transacción comercial base
            }
        );
    });
};

module.exports = db;
