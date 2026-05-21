const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'tripoliven_admin',
    password: process.env.DB_PASSWORD || 'tripoliven_secure_pwd_2026',
    database: process.env.DB_NAME || 'tripoliven_db'
});

async function dropTables() {
    try {
        console.log('Droping PostgreSQL tables...');
        
        // This is a much cleaner way to drop all tables in PG
        await pool.query('DROP SCHEMA public CASCADE;');
        await pool.query('CREATE SCHEMA public;');
        await pool.query('GRANT ALL ON SCHEMA public TO public;');
        await pool.query('GRANT ALL ON SCHEMA public TO tripoliven_admin;');
        
        console.log('Tables dropped successfully.');
    } catch (err) {
        console.error('Error dropping tables:', err);
    } finally {
        await pool.end();
    }
}

dropTables();
