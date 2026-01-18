import Database from "better-sqlite3";

const isDev = process.env.IS_DEV == "true";

// "/data" must be outside src folder to not be accessible from outside
// node load files from project dir - different than importss
const db = new Database("./data/db.sqlite", {
  verbose: isDev ? console.log : null,
});

//DB Migration
db.exec(`
    CREATE TABLE IF NOT EXISTS pins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reported_pins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pin_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

export default db;
