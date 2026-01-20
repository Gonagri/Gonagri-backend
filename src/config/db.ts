import { Pool } from 'pg';
import { DATABASE_URL, NODE_ENV, NEON_API_KEY, NEON_PROJECT_ID } from './env';

// Get connection string from Neon API if API key is provided
const getConnectionString = async (): Promise<string> => {
  if (DATABASE_URL) {
    return DATABASE_URL;
  }

  if (NEON_API_KEY && NEON_PROJECT_ID) {
    try {
      const response = await fetch(
        `https://api.neon.tech/v1/projects/${NEON_PROJECT_ID}/connection_string`,
        {
          headers: {
            Authorization: `Bearer ${NEON_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Neon API error: ${response.statusText}`);
      }

      const data = await response.json() as { connection_string: string };
      return data.connection_string;
    } catch (err) {
      console.error('[DB] Failed to fetch connection string from Neon API:', err);
      throw err;
    }
  }

  throw new Error('[DB] No valid database configuration provided');
};

let pool: Pool | undefined;
let poolPromise: Promise<Pool> | undefined;

// Initialize pool with async operation
const initializePool = async (): Promise<Pool> => {
  if (pool) {
    return pool;
  }

  const connectionString = await getConnectionString();

  pool = new Pool({
    connectionString,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
    max: NODE_ENV === 'production' ? 20 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000,
  });

  // Connection pool error handling
  pool.on('error', (err) => {
    console.error('[DB Pool Error]', err);
  });

  pool.on('connect', () => {
    console.log('[DB] Connection established');
  });

  return pool;
};

// Test connection on startup
const testConnection = async (retries = 3, delay = 1000): Promise<void> => {
  if (!pool) {
    throw new Error('[DB] Pool not initialized');
  }

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

// Get or initialize pool
const getPool = async (): Promise<Pool> => {
  if (pool) {
    return pool;
  }

  if (!poolPromise) {
    poolPromise = initializePool();
  }

  return poolPromise;
};

// Initialize pool and test connection on app start (non-blocking)
poolPromise = initializePool()
  .then((p) => {
    testConnection(5, 2000).catch((err) => {
      console.warn('[DB Warning]', err.message);
      console.warn('[DB] Server running without database connection');
    });
    return p;
  })
  .catch((err) => {
    console.warn('[DB Warning]', err.message);
    console.warn('[DB] Server running without database connection');
    throw err;
  });

export { getPool };
