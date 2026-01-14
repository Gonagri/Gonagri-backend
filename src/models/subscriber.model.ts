import pool from '../config/db';
import { ConflictError } from '../utils/ApiError';

export interface Subscriber {
  id: number;
  email: string;
  created_at: string;
}

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
      // Unique constraint violation
      throw new ConflictError('Email is already subscribed to the waitlist');
    }
    throw error;
  }
};

export const getSubscriberByEmail = async (email: string): Promise<Subscriber | null> => {
  const query = 'SELECT * FROM subscribers WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
};

export const getAllSubscribers = async (): Promise<Subscriber[]> => {
  const query = 'SELECT * FROM subscribers ORDER BY created_at DESC';
  const result = await pool.query(query);
  return result.rows;
};
