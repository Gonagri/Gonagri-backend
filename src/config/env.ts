import dotenv from 'dotenv';

dotenv.config();

// Fail fast if critical environment variables are missing
const requiredEnvVars = ['DATABASE_URL', 'CORS_ORIGIN'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(
      `[Configuration Error] Missing required environment variable: ${envVar}`
    );
  }
});

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DATABASE_URL = process.env.DATABASE_URL as string;
export const CORS_ORIGIN = process.env.CORS_ORIGIN as string;
