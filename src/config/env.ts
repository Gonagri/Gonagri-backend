import dotenv from 'dotenv';

dotenv.config();

// Fail fast if critical environment variables are missing
const requiredEnvVars = ['CORS_ORIGIN'];

// Either DATABASE_URL or NEON_API_KEY must be provided
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasNeonApiKey = !!process.env.NEON_API_KEY;

if (!hasDatabaseUrl && !hasNeonApiKey) {
  throw new Error(
    `[Configuration Error] Either DATABASE_URL or NEON_API_KEY must be provided`
  );
}

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(
      `[Configuration Error] Missing required environment variable: ${envVar}`
    );
  }
});

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const NEON_API_KEY = process.env.NEON_API_KEY || '';
export const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID || '';
export const CORS_ORIGIN = process.env.CORS_ORIGIN as string;
