const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn('[db] DATABASE_URL is not set. Database queries will fail until it is configured.');
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