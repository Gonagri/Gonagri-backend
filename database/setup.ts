import pool from '../src/config/db';
import fs from 'fs';
import path from 'path';

/**
 * Database Setup Script
 * 
 * Runs migrations and initializes the database schema.
 * Usage: npx ts-node database/setup.ts
 */

async function setupDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('[DB Setup] Starting database initialization...');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and filter empty statements
    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log(`[DB Setup] ✓ Executed: ${statement.substring(0, 50)}...`);
      } catch (error: any) {
        console.error(`[DB Setup] ✗ Error executing statement: ${error.message}`);
        throw error;
      }
    }

    console.log('[DB Setup] ✓ Database initialization complete!');

    // Print table info
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log('[DB Setup] Tables created:');
    tables.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('[DB Setup] Fatal error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run setup
setupDatabase();
