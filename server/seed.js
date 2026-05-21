const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tripoliven_db'
});

async function seedData() {
    try {
        console.log('Starting seed process...');

        // 1. Add new products
        const newProducts = [
            { name: 'Sulfato de Sodio', description: 'Uso industrial y detergentes' },
            { name: 'Carbonato de Sodio', description: 'Ceniza de sosa para vidrio y detergentes' },
            { name: 'Bicarbonato de Sodio', description: 'Uso alimentario e industrial' },
            { name: 'Cloruro de Sodio', description: 'Sal industrial' },
            { name: 'Ácido Sulfúrico', description: 'Reactivo químico industrial' },
            { name: 'Hidróxido de Sodio', description: 'Soda cáustica' },
            { name: 'Silicato de Sodio', description: 'Fabricación de detergentes' }
        ];

        for (const prod of newProducts) {
            await pool.query(
                'INSERT INTO product_types (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
                [prod.name, prod.description]
            );
        }
        console.log('Added new products.');

        // 2. Add clients
        const clientsData = [];
        for (let i = 1; i <= 20; i++) {
            clientsData.push({
                name: `Cliente Empresa ${i} C.A.`,
                rif: `J-${Math.floor(10000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 9)}`,
                state: ['Carabobo', 'Miranda', 'Distrito Capital', 'Aragua', 'Lara', 'Zulia'][Math.floor(Math.random() * 6)],
                address: `Av. Principal, Zona Industrial ${i}`,
                phone: `0414-${Math.floor(1000000 + Math.random() * 9000000)}`,
                contact_person: `Contacto ${i}`,
                email: `contacto${i}@empresa${i}.com`
            });
        }

        const insertedClients = [];
        for (const client of clientsData) {
            const res = await pool.query(
                'INSERT INTO clients (name, rif, state, address, phone, contact_person, email) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (rif) DO NOTHING RETURNING id',
                [client.name, client.rif, client.state, client.address, client.phone, client.contact_person, client.email]
            );
            if (res.rows.length > 0) {
                insertedClients.push(res.rows[0].id);
            }
        }
        console.log('Added clients.');

        // Get all clients and product types to create dispatches
        const allClientsRes = await pool.query('SELECT id FROM clients');
        const clientIds = allClientsRes.rows.map(r => r.id);

        const allProductsRes = await pool.query('SELECT name FROM product_types');
        const productNames = allProductsRes.rows.map(r => r.name);

        const allUsersRes = await pool.query('SELECT id FROM users LIMIT 1');
        const userId = allUsersRes.rows.length > 0 ? allUsersRes.rows[0].id : null;

        // 3. Add 50 dispatches
        if (clientIds.length > 0 && productNames.length > 0) {
            for (let i = 1; i <= 50; i++) {
                const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
                const productType = productNames[Math.floor(Math.random() * productNames.length)];
                const quantity = (Math.random() * 30 + 5).toFixed(2); // 5 to 35 tons
                const state = ['Carabobo', 'Miranda', 'Distrito Capital', 'Aragua', 'Lara', 'Zulia'][Math.floor(Math.random() * 6)];
                
                // Random date in the last 6 months
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 180));
                const dispatchDatetime = date.toISOString().slice(0, 19).replace('T', ' ');

                const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}-${i}`;
                const driverName = `Chofer ${i}`;
                const licensePlate = `ABC-${Math.floor(100 + Math.random() * 899)}`;
                const status = Math.random() > 0.8 ? 'En Tránsito' : (Math.random() > 0.5 ? 'Despachado' : 'Entregado');

                await pool.query(
                    `INSERT INTO dispatches 
                    (client_id, product_type, quantity_tm, destination_state, dispatch_datetime, order_number, driver_name, license_plate, status, created_by) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (order_number) DO NOTHING`,
                    [clientId, productType, quantity, state, dispatchDatetime, orderNumber, driverName, licensePlate, status, userId]
                );
            }
            console.log('Added 50 dispatches.');
        } else {
            console.log('Could not add dispatches. No clients or products found.');
        }

        console.log('Seed process completed successfully.');
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        await pool.end();
    }
}

seedData();
