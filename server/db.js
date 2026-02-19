const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (connectionString) {
  try {
    const u = new URL(connectionString);
    console.log("[db] host:", u.host, "user:", u.username, "db:", u.pathname);
  } catch {
    console.log("[db] DATABASE_URL present but not a valid URL");
  }
}
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('[db] Unexpected PostgreSQL pool error:', err);
});

const query = async (text, params = []) => pool.query(text, params);

module.exports = { pool, query };