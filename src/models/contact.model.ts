import { getPool } from '../config/db';
import { NotFoundError } from '../utils/ApiError';

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

/**
 * Add a new contact message
 * @param name - Sender's name
 * @param email - Sender's email
 * @param message - Message content
 * @returns ContactMessage object
 */
export const addContactMessage = async (
  name: string,
  email: string,
  message: string
): Promise<ContactMessage> => {
  const pool = await getPool();
  const query = `
    INSERT INTO contact_messages (name, email, message)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, message, created_at
  `;
  const result = await pool.query(query, [name, email, message]);
  return result.rows[0];
};

/**
 * Get all contact messages (paginated)
 * @param limit - Number of results (default 100)
 * @param offset - Offset for pagination (default 0)
 * @returns Array of ContactMessage objects
 */
export const getContactMessages = async (
  limit: number = 100,
  offset: number = 0
): Promise<ContactMessage[]> => {
  const pool = await getPool();
  const query = `
    SELECT id, name, email, message, created_at 
    FROM contact_messages 
    ORDER BY created_at DESC 
    LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

/**
 * Get a single contact message by ID
 * @param id - Message ID
 * @returns ContactMessage or null if not found
 */
export const getContactMessageById = async (
  id: number
): Promise<ContactMessage | null> => {
  const pool = await getPool();
  const query = `
    SELECT id, name, email, message, created_at 
    FROM contact_messages 
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

/**
 * Get messages by email address
 * @param email - Sender's email
 * @param limit - Number of results (default 50)
 * @returns Array of ContactMessage objects
 */
export const getMessagesByEmail = async (
  email: string,
  limit: number = 50
): Promise<ContactMessage[]> => {
  const pool = await getPool();
  const query = `
    SELECT id, name, email, message, created_at 
    FROM contact_messages 
    WHERE email = $1 
    ORDER BY created_at DESC 
    LIMIT $2
  `;
  const result = await pool.query(query, [email, limit]);
  return result.rows;
};

/**
 * Get total count of contact messages
 * @returns Total number of messages
 */
export const getContactMessageCount = async (): Promise<number> => {
  const pool = await getPool();
  const query = 'SELECT COUNT(*) as count FROM contact_messages';
  const result = await pool.query(query);
  return parseInt(result.rows[0].count, 10);
};

/**
 * Delete a contact message by ID
 * @param id - Message ID
 * @returns True if deleted, false if not found
 */
export const deleteContactMessage = async (id: number): Promise<boolean> => {
  const pool = await getPool();
  const query = 'DELETE FROM contact_messages WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

/**
 * Get messages within a date range
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Array of ContactMessage objects
 */
export const getMessagesByDateRange = async (
  startDate: string,
  endDate: string
): Promise<ContactMessage[]> => {
  const pool = await getPool();
  const query = `
    SELECT id, name, email, message, created_at 
    FROM contact_messages 
    WHERE created_at >= $1 AND created_at <= $2
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows;
};
