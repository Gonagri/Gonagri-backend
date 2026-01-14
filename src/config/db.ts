import { Pool, PoolClient } from 'pg';
import { DATABASE_URL, NODE_ENV } from './env';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection pool error handling
pool.on('error', (err, client) => {
  console.error('[DB Pool Error]', err);
});

pool.on('connect', () => {
  console.log('[DB] Connection established');
});

// Test connection on startup
const testConnection = async (retries = 3, delay = 1000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[DB] Connection test successful');
      return;
    } catch (err) {
      console.error(`[DB] Connection attempt ${i + 1}/${retries} failed:`, err);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error('[DB] Failed to connect to database after retries');
      }
    }
  }
};

// Initialize on import
testConnection().catch((err) => {
  console.error('[Startup Error]', err.message);
  process.exit(1);
});

export default pool;

