require('dotenv').config();
const { Pool, Client } = require('pg');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'tripoliven_admin',
    password: process.env.DB_PASSWORD || 'tripoliven_secure_pwd_2026',
    database: process.env.DB_NAME || 'tripoliven_db'
};

const pool = new Pool(dbConfig);

// Helper para crear automáticamente la base de datos si no existe
async function ensureDatabaseExists() {
    const adminConfig = {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: 'postgres' // Conectarse a la base de datos por defecto 'postgres'
    };
    
    const client = new Client(adminConfig);
    try {
        await client.connect();
        const targetDbName = dbConfig.database;
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDbName]);
        if (res.rowCount === 0) {
            console.log(`[BASE DATOS] La base de datos "${targetDbName}" no existe. Creándola...`);
            await client.query(`CREATE DATABASE "${targetDbName}"`);
            console.log(`[BASE DATOS] Base de datos "${targetDbName}" creada exitosamente.`);
        }
    } catch (err) {
        console.warn('⚠️ [BASE DATOS] Nota: No se pudo verificar o crear la base de datos de forma automática:', err.message);
    } finally {
        try {
            await client.end();
        } catch (e) {}
    }
}

// Helper to translate SQLite '?' placeholders to PostgreSQL '$1', '$2', ...
function translateQuery(sql) {
    let index = 1;
    let translated = sql.replace(/\?/g, () => `$${index++}`);
    
    // If it's an INSERT and has no RETURNING clause, append ' RETURNING id' to get lastID
    const trimmed = translated.trim();
    if (trimmed.toUpperCase().startsWith('INSERT') && !trimmed.toUpperCase().includes('RETURNING')) {
        translated += ' RETURNING id';
    }
    return translated;
}

// Mimic the sqlite3 API
const db = {};

db.all = function (sql, params = [], callback) {
    const translatedSql = translateQuery(sql);
    pool.query(translatedSql, params, (err, res) => {
        if (err) {
            if (callback) callback(err);
            return;
        }
        if (callback) {
            callback(null, res.rows || []);
        }
    });
};

db.get = function (sql, params = [], callback) {
    const translatedSql = translateQuery(sql);
    pool.query(translatedSql, params, (err, res) => {
        if (err) {
            if (callback) callback(err);
            return;
        }
        if (callback) {
            callback(null, res.rows && res.rows[0] ? res.rows[0] : null);
        }
    });
};

db.run = function (sql, params = [], callback) {
    const translatedSql = translateQuery(sql);
    pool.query(translatedSql, params, (err, res) => {
        if (err) {
            if (callback) callback(err);
            return;
        }
        
        const context = {
            lastID: res.rows && res.rows[0] ? res.rows[0].id : null,
            changes: res.rowCount
        };
        
        if (callback) {
            callback.call(context, null);
        }
    });
};

// Compatibility for routes/system.js close call
db.close = function (callback) {
    pool.end((err) => {
        if (callback) callback(err);
    });
};

// logAudit helper
db.logAudit = (userId, action, details, ipAddress) => {
    return new Promise((resolve) => {
        db.run(
            `INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`,
            [userId || null, action, details || null, ipAddress || null],
            (err) => {
                if (err) {
                    console.error('[AUDITORÍA] Error al registrar log de auditoría:', err.message);
                }
                resolve();
            }
        );
    });
};

// Initialize schema and seed data
async function initializeSchema() {
    try {
        // Asegurar que la base de datos existe primero
        await ensureDatabaseExists();
        
        console.log('PostgreSQL: Inicializando esquema y tablas...');
        
        // 1. Departamentos
        await pool.query(`CREATE TABLE IF NOT EXISTS departments (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            manager_id INTEGER,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Cargos
        await pool.query(`CREATE TABLE IF NOT EXISTS positions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            department_id INTEGER NOT NULL,
            description TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments (id)
        )`);

        // 3. Usuarios
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            system_role VARCHAR(100) NOT NULL DEFAULT 'Usuario',
            status VARCHAR(100) NOT NULL DEFAULT 'Activo',
            position_id INTEGER,
            department_id INTEGER,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (position_id) REFERENCES positions (id),
            FOREIGN KEY (department_id) REFERENCES departments (id)
        )`);

        // 4. Tipos de producto
        await pool.query(`CREATE TABLE IF NOT EXISTS product_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            status VARCHAR(100) NOT NULL DEFAULT 'Activo',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // 5. Clientes
        await pool.query(`CREATE TABLE IF NOT EXISTS clients (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            rif VARCHAR(255) NOT NULL UNIQUE,
            state VARCHAR(255) NOT NULL,
            address TEXT,
            phone VARCHAR(100),
            contact_person VARCHAR(255),
            email VARCHAR(255),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // 6. Despachos
        await pool.query(`CREATE TABLE IF NOT EXISTS dispatches (
            id SERIAL PRIMARY KEY,
            client_id INTEGER NOT NULL,
            product_type VARCHAR(255) NOT NULL,
            quantity_tm DOUBLE PRECISION NOT NULL,
            destination_state VARCHAR(255) NOT NULL,
            dispatch_datetime VARCHAR(255) NOT NULL,
            order_number VARCHAR(255) UNIQUE NOT NULL,
            driver_name VARCHAR(255),
            license_plate VARCHAR(100),
            status VARCHAR(100) NOT NULL DEFAULT 'Despachado',
            created_by INTEGER,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients (id),
            FOREIGN KEY (created_by) REFERENCES users (id)
        )`);

        // 7. Logs de auditoría
        await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            action VARCHAR(255) NOT NULL,
            details TEXT,
            ip_address VARCHAR(100),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Crear Índices de optimización de rendimiento
        await pool.query("CREATE INDEX IF NOT EXISTS idx_dispatches_dispatch_date ON dispatches(dispatch_datetime);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_dispatches_product_type ON dispatches(product_type);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_dispatches_client_id ON dispatches(client_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_dispatches_created_by ON dispatches(created_by);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_positions_department_id ON positions(department_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_users_position_id ON users(position_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(createdAt);");

        console.log('PostgreSQL: Esquema de tablas creado con éxito.');

        // Semillar datos iniciales
        // A. Departamentos, Cargos y Admin Maestro
        const depCount = await pool.query("SELECT count(*) as count FROM departments");
        if (parseInt(depCount.rows[0].count) === 0) {
            console.log('Migración: Inicializando departamentos y cargos...');
            await pool.query("INSERT INTO departments (id, name, description) VALUES (1, 'Tecnología (TI)', 'Soporte y desarrollo de sistemas')");
            await pool.query("INSERT INTO positions (id, name, department_id, description) VALUES (1, 'Jefe de Sistemas', 1, 'Líder de TI y Administrador del Sistema')");
            
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            await pool.query("INSERT INTO users (name, email, username, password, system_role, status, position_id, department_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", 
            ['Admin TripoliERP', 'admin@tripolierp.com', 'admin', hashedPassword, 'Administrador', 'Activo', 1, 1]);
            
            // Ajustar secuencias de ID en Postgres para evitar conflictos futuros por los IDs estáticos insertados
            await pool.query("SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments))");
            await pool.query("SELECT setval('positions_id_seq', (SELECT MAX(id) FROM positions))");
            await pool.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
            console.log('Migración: Personal de TI y administrador creados.');
        }

        // B. Catalogo de Productos
        const prodCount = await pool.query("SELECT count(*) as count FROM product_types");
        if (parseInt(prodCount.rows[0].count) === 0) {
            console.log('Migración: Inicializando tipos de producto...');
            await pool.query("INSERT INTO product_types (name, description) VALUES ('Tripolifosfato', 'Fosfatos de sodio para la industria de detergentes y alimentos')");
            await pool.query("INSERT INTO product_types (name, description) VALUES ('Ácido Fosfórico', 'Ácidos concentrados de uso técnico y alimenticio')");
            await pool.query("INSERT INTO product_types (name, description) VALUES ('Pirofosfato', 'Sales de pirofosfato tetrasódico para emulsionantes y estabilizantes')");
            await pool.query("INSERT INTO product_types (name, description) VALUES ('Otros', 'Otros productos y subproductos industriales')");
            console.log('Migración: Catálogo de productos inicializado.');
        }
        
    } catch (err) {
        console.error('⚠️ [MIGRACIÓN POSTGRES] Error al inicializar esquema o semillas:', err.message);
    }
}

// Iniciar inicialización asíncrona
initializeSchema();

module.exports = db;
