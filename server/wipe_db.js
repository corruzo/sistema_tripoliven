const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'tripoliven_admin',
    password: process.env.DB_PASSWORD || 'tripoliven_secure_pwd_2026',
    database: process.env.DB_NAME || 'tripoliven_db'
});

async function wipeDatabase() {
    try {
        console.log('Wiping database and applying seeds...');
        
        await pool.query('BEGIN');
        
        // Disable foreign keys temporarily
        await pool.query('SET session_replication_role = replica;');
        
        await pool.query('DELETE FROM dispatches;');
        await pool.query('DELETE FROM clients;');
        await pool.query('DELETE FROM product_types;');
        await pool.query('DELETE FROM users;');
        await pool.query('DELETE FROM positions;');
        await pool.query('DELETE FROM departments;');
        
        // Reset sequences (or seeds below will handle them if explicit IDs are used)
        
        await pool.query("INSERT INTO departments (id, name, description) VALUES (1, 'Tecnología (TI)', 'Soporte y desarrollo de sistemas')");
        await pool.query("INSERT INTO positions (id, name, department_id, description) VALUES (1, 'Jefe de Sistemas', 1, 'Líder de TI y Administrador del Sistema')");
        
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        await pool.query("INSERT INTO users (id, name, email, username, password, system_role, status, position_id, department_id) VALUES (1, 'Admin Tripoliven', 'admin@tripoliven.com', 'admin', $1, 'Administrador', 'Activo', 1, 1)", [hashedPassword]);

        await pool.query("INSERT INTO product_types (name, description) VALUES ('Tripolifosfato', 'Fosfatos de sodio para la industria de detergentes y alimentos')");
        await pool.query("INSERT INTO product_types (name, description) VALUES ('Ácido Fosfórico', 'Ácidos concentrados de uso técnico y alimenticio')");
        await pool.query("INSERT INTO product_types (name, description) VALUES ('Pirofosfato', 'Sales de pirofosfato tetrasódico para emulsionantes y estabilizantes')");
        await pool.query("INSERT INTO product_types (name, description) VALUES ('Otros', 'Otros productos y subproductos industriales')");

        // Re-enable foreign keys
        await pool.query('SET session_replication_role = DEFAULT;');
        
        await pool.query("SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments))");
        await pool.query("SELECT setval('positions_id_seq', (SELECT MAX(id) FROM positions))");
        await pool.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
        
        await pool.query('COMMIT');
        
        console.log('Base de datos reiniciada a estado de fábrica (desde 0).');
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error', err);
    } finally {
        await pool.end();
    }
}

wipeDatabase();
