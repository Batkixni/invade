const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'data', 'invade.db'));
const rows = db.prepare('SELECT slug, title FROM news').all();
console.log(JSON.stringify(rows, null, 2));
db.close();
