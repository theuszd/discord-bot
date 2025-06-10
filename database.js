const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

// Inicializa o banco
async function initDB() {
  const db = await open({
    filename: './registro.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS registros (
      user_id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      id TEXT NOT NULL,
      telefone TEXT NOT NULL
    );
  `);

  return db;
}

module.exports = { initDB };
