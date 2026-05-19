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
        
        db.run("DROP TABLE IF EXISTS dispatches;");
        db.run("DROP TABLE IF EXISTS clients;");
        db.run("DROP TABLE IF EXISTS product_types;");
        db.run("DROP TABLE IF EXISTS users;");
        db.run("DROP TABLE IF EXISTS positions;");
        db.run("DROP TABLE IF EXISTS departments;");
        
        db.run("PRAGMA foreign_keys = ON;", () => {
            console.log('Tables dropped.');
            process.exit(0);
        });
    });
});
