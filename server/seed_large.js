require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tripoliven_db'
};

const pool = new Pool(dbConfig);

const VENEZUELAN_STATES = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo',
    'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara',
    'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre',
    'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
];

const COMPANY_PREFIXES = [
    'Corporación', 'Alimentos', 'Detergentes', 'Química', 'Distribuidora',
    'Inversiones', 'Consorcio', 'Logística', 'Suministros', 'Industrias'
];

const COMPANY_SUFFIXES = [
    'del Centro', 'Nacional', 'Occidente', 'Oriente', 'Polar', 'Venequim',
    'Caribe', 'Orinoco', 'Andina', 'Latina', 'Industrial', 'Sur del Lago'
];

const PRODUCTS = ['Tripolifosfato', 'Ácido Fosfórico', 'Pirofosfato', 'Otros'];

const DRIVERS = [
    'Juan Carlos Pérez', 'José Gregorio Rodríguez', 'Luis Alejandro Mendoza',
    'Carlos Eduardo Gómez', 'Miguel Ángel Torres', 'Pedro José González',
    'Francisco Javier Silva', 'Manuel Vicente Díaz', 'Jesús Alberto Hernández',
    'Ramón Antonio Castillo', 'Daniel Eduardo Morales', 'Jorge Luis Rivas'
];

const LICENSE_PLATES = [
    'A10BC2D', 'B20CD3E', 'C30DE4F', 'D40EF5G', 'E50FG6H', 'F60GH7I',
    'G70HI8J', 'H80IJ9K', 'I90JK0L', 'J01KL1M', 'K12LM2N', 'L23MN3O'
];

function generateRIF(index) {
    const baseNumber = 40000000 + index;
    const dv = (baseNumber % 9) + 1; // digit verifier
    return `J-${baseNumber}-${dv}`;
}

function generateOrderNumber(index) {
    const base = 26000 + index;
    return `TRIP-${base}`;
}

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomRange(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randomDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(8 + Math.floor(Math.random() * 9));
    date.setMinutes(Math.floor(Math.random() * 60));
    
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return `${dateStr}T${timeStr}`;
}

async function seedLargeDataset() {
    try {
        console.log('⚡ Conectando a la base de datos PostgreSQL...');
        await pool.query('SELECT NOW()');
        console.log('✅ Conectado exitosamente.');

        // Obtener el ID de un usuario para asociarlo al despacho (created_by)
        const userRes = await pool.query("SELECT id FROM users LIMIT 1");
        if (userRes.rowCount === 0) {
            console.log('❌ Error: No hay usuarios registrados en el sistema. Inicia el servidor o ejecuta wipe_db primero.');
            process.exit(1);
        }
        const userId = userRes.rows[0].id;
        console.log(`👤 Utilizando usuario ID: ${userId} para registrar despachos.`);

        console.log('🧹 Limpiando despachos y clientes anteriores...');
        await pool.query('DELETE FROM dispatches');
        await pool.query('DELETE FROM clients');
        await pool.query("SELECT setval('clients_id_seq', 1, false)");
        await pool.query("SELECT setval('dispatches_id_seq', 1, false)");
        console.log('✅ Base de datos limpia de registros de prueba.');

        console.log('🏭 Insertando 35 clientes...');
        const clientIds = [];
        for (let i = 1; i <= 35; i++) {
            const prefix = COMPANY_PREFIXES[i % COMPANY_PREFIXES.length];
            const suffix = COMPANY_SUFFIXES[(i * 3) % COMPANY_SUFFIXES.length];
            const name = `${prefix} ${suffix} ${i}`;
            const rif = generateRIF(i);
            // Aseguramos que se distribuyan bien entre los estados
            const state = VENEZUELAN_STATES[(i - 1) % VENEZUELAN_STATES.length];
            const address = `Zona Industrial, Avenida Principal, local ${i * 4}, Estado ${state}`;
            const phone = `0241-8${String(i).padStart(6, '0')}`;
            const email = `contacto@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
            const contactPerson = `Gerente de Logística ${i}`;

            const res = await pool.query(
                `INSERT INTO clients (name, rif, state, address, phone, contact_person, email) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [name, rif, state, address, phone, contactPerson, email]
            );
            clientIds.push(res.rows[0].id);
        }
        console.log(`✅ 35 clientes insertados exitosamente.`);

        console.log('🚚 Insertando 50 despachos distribuidos uniformemente por todo el país...');
        for (let i = 1; i <= 50; i++) {
            // Pick a client from our list
            const clientId = clientIds[(i - 1) % clientIds.length];
            const product = randomElement(PRODUCTS);
            const qty = randomRange(10.0, 48.0);
            
            // Garantizar distribución en todos los estados de destino
            const destinationState = VENEZUELAN_STATES[(i - 1) % VENEZUELAN_STATES.length];
            const dispatchTime = randomDate(30); // últimos 30 días
            const orderNumber = generateOrderNumber(i);
            const driver = randomElement(DRIVERS);
            const plate = randomElement(LICENSE_PLATES);
            
            // Variar los estados del despacho
            const statusOptions = ['Despachado', 'Entregado', 'Transito'];
            const status = statusOptions[i % statusOptions.length];

            await pool.query(
                `INSERT INTO dispatches 
                 (client_id, product_type, quantity_tm, destination_state, dispatch_datetime, order_number, driver_name, license_plate, status, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [clientId, product, qty, destinationState, dispatchTime, orderNumber, driver, plate, status, userId]
            );
        }
        console.log(`✅ 50 despachos insertados exitosamente.`);
        console.log('🎉 ¡Poblado de base de datos completado con éxito!');
        
    } catch (err) {
        console.error('❌ Error fatal al poblar datos:', err.message);
    } finally {
        await pool.end();
    }
}

seedLargeDataset();
