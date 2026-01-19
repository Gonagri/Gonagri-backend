/**
 * Database Utilities
 * Helper functions for database operations
 */

import { getPool } from '../config/db';

/**
 * Check if database connection is healthy
 * @returns Promise<boolean> - true if connection is healthy
 */
export const isDbHealthy = async (): Promise<boolean> => {
  try {
    const pool = await getPool();
    const result = await pool.query('SELECT 1');
    return result.rowCount === 1;
  } catch (error) {
    return false;
  }
};

/**
 * Get database statistics
 * @returns Promise with table info and stats
 */
export const getDatabaseStats = async () => {
  try {
    const pool = await getPool();
    const subscribersCount = await pool.query(
      'SELECT COUNT(*) as count FROM subscribers'
    );
    const messagesCount = await pool.query(
      'SELECT COUNT(*) as count FROM contact_messages'
    );
    const dbSize = await pool.query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    );

    return {
      success: true,
      data: {
        subscribers: parseInt(subscribersCount.rows[0].count, 10),
        messages: parseInt(messagesCount.rows[0].count, 10),
        databaseSize: dbSize.rows[0].size,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Clear all data from database (destructive)
 * WARNING: This will delete all data
 * @returns Promise with deletion confirmation
 */
export const clearDatabase = async () => {
  try {
    const pool = await getPool();
    await pool.query('DELETE FROM contact_messages');
    await pool.query('DELETE FROM subscribers');

    return {
      success: true,
      message: 'All data cleared successfully',
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Reset auto-increment sequences
 * @returns Promise with reset confirmation
 */
export const resetSequences = async () => {
  try {
    const pool = await getPool();
    await pool.query('ALTER SEQUENCE subscribers_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE contact_messages_id_seq RESTART WITH 1');

    return {
      success: true,
      message: 'Sequences reset successfully',
    };
  } catch (error) {
    throw error;
  }
};
