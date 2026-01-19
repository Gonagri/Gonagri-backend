import pool from '../config/db';
import { ConflictError, NotFoundError } from '../utils/ApiError';

export interface Subscriber {
  id: number;
  email: string;
  created_at: string;
}

/**
 * Add a new subscriber to the waitlist
 * @param email - Email address to subscribe
 * @returns Subscriber object with id, email, created_at
 * @throws ConflictError if email already exists
 */
export const addSubscriber = async (email: string): Promise<Subscriber> => {
  try {
    const query = `
      INSERT INTO subscribers (email)
      VALUES ($1)
      RETURNING id, email, created_at
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      // Unique constraint violation - email already exists
      throw new ConflictError('Email is already subscribed to the waitlist');
    }
    throw error;
  }
};

/**
 * Get a subscriber by email
 * @param email - Email to search for
 * @returns Subscriber object or null if not found
 */
export const getSubscriberByEmail = async (
  email: string
): Promise<Subscriber | null> => {
  const query = 'SELECT id, email, created_at FROM subscribers WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
};

/**
 * Get a subscriber by ID
 * @param id - Subscriber ID
 * @returns Subscriber object or null if not found
 */
export const getSubscriberById = async (id: number): Promise<Subscriber | null> => {
  const query = 'SELECT id, email, created_at FROM subscribers WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

/**
 * Get all subscribers (paginated)
 * @param limit - Number of results (default 100)
 * @param offset - Offset for pagination (default 0)
 * @returns Array of Subscriber objects
 */
export const getAllSubscribers = async (
  limit: number = 100,
  offset: number = 0
): Promise<Subscriber[]> => {
  const query = `
    SELECT id, email, created_at 
    FROM subscribers 
    ORDER BY created_at DESC 
    LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

/**
 * Get total count of subscribers
 * @returns Total number of subscribers
 */
export const getSubscriberCount = async (): Promise<number> => {
  const query = 'SELECT COUNT(*) as count FROM subscribers';
  const result = await pool.query(query);
  return parseInt(result.rows[0].count, 10);
};

/**
 * Delete a subscriber by email
 * @param email - Email to delete
 * @returns True if deleted, false if not found
 */
export const deleteSubscriberByEmail = async (email: string): Promise<boolean> => {
  const query = 'DELETE FROM subscribers WHERE email = $1 RETURNING id';
  const result = await pool.query(query, [email]);
  return result.rowCount !== null && result.rowCount > 0;
};

/**
 * Check if email is already subscribed
 * @param email - Email to check
 * @returns True if exists, false otherwise
 */
export const emailExists = async (email: string): Promise<boolean> => {
  const subscriber = await getSubscriberByEmail(email);
  return subscriber !== null;
};
