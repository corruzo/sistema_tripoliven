const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error', err);
        process.exit(1);
    }
    
    db.serialize(() => {
        db.run("PRAGMA foreign_keys = OFF;");
        
        db.run("DELETE FROM dispatches;");
        db.run("DELETE FROM clients;");
        db.run("DELETE FROM product_types;");
        db.run("DELETE FROM users;");
        db.run("DELETE FROM positions;");
        db.run("DELETE FROM departments;");
        db.run("DELETE FROM sqlite_sequence;");
        
        db.run("INSERT INTO departments (id, name, description) VALUES (1, 'Tecnología (TI)', 'Soporte y desarrollo de sistemas')");
        db.run("INSERT INTO positions (id, name, department_id, description) VALUES (1, 'Jefe de Sistemas', 1, 'Líder de TI y Administrador del Sistema')");
        db.run("INSERT INTO users (name, email, username, password, system_role, status, position_id, department_id) VALUES ('Admin Tripoliven', 'admin@tripoliven.com', 'admin', 'admin123', 'Administrador', 'Activo', 1, 1)");

        db.run("INSERT INTO product_types (name, description) VALUES ('Tripolifosfato', 'Fosfatos de sodio para la industria de detergentes y alimentos')");
        db.run("INSERT INTO product_types (name, description) VALUES ('Ácido Fosfórico', 'Ácidos concentrados de uso técnico y alimenticio')");
        db.run("INSERT INTO product_types (name, description) VALUES ('Pirofosfato', 'Sales de pirofosfato tetrasódico para emulsionantes y estabilizantes')");
        db.run("INSERT INTO product_types (name, description) VALUES ('Otros', 'Otros productos y subproductos industriales')");

        db.run("PRAGMA foreign_keys = ON;", () => {
            console.log('Base de datos reiniciada a estado de fábrica (desde 0).');
            process.exit(0);
        });
    });
});
