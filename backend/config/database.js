const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

function requiredEnv(name) {
  const v = process.env[name];
  if (v === undefined || v === null || String(v).trim() === '') {
    throw new Error(`Missing required environment variable: ${name}. Set it in backend/.env`);
  }
  return String(v);
}

function normalizeHost(host) {
  const h = String(host || '').trim();
  if (!h) return '127.0.0.1';
  // On Windows, 'localhost' can resolve to IPv6 (::1) and time out if Postgres listens only on IPv4.
  if (h.toLowerCase() === 'localhost') return '127.0.0.1';
  return h;
}

function toInt(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

// PostgreSQL connection pool
let pool;
try {
  const host = normalizeHost(process.env.DB_HOST);
  const port = toInt(process.env.DB_PORT, 5432);
  const database = requiredEnv('DB_NAME');
  const user = requiredEnv('DB_USER');
  const password = requiredEnv('DB_PASSWORD');
  const connectionTimeoutMillis = toInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10000);

  console.log('🔌 PostgreSQL config', {
    host,
    port,
    database,
    user,
    connectionTimeoutMillis,
  });

  pool = new Pool({
    host,
    port,
    database,
    user,
    password,
    max: 20, // Maximum number of clients in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis,
  });
} catch (e) {
  console.error('❌ Database config error:', e?.message || e);
  // Fail fast so the error is obvious rather than hanging on connection attempts.
  process.exit(1);
}

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to get a client from pool
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  // Monkey patch the release method to clear our timeout
  client.release = () => {
    clearTimeout(timeout);
    client.release = release;
    return release();
  };
  
  return client;
};

module.exports = {
  pool,
  query,
  getClient,
};
