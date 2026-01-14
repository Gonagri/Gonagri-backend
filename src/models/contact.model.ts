import pool from '../config/db';

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export const addContactMessage = async (
  name: string,
  email: string,
  message: string
): Promise<ContactMessage> => {
  const query = `
    INSERT INTO contact_messages (name, email, message)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, message, created_at
  `;
  const result = await pool.query(query, [name, email, message]);
  return result.rows[0];
};

export const getContactMessages = async (): Promise<ContactMessage[]> => {
  const query = 'SELECT * FROM contact_messages ORDER BY created_at DESC';
  const result = await pool.query(query);
  return result.rows;
};

export const getContactMessageById = async (
  id: number
): Promise<ContactMessage | null> => {
  const query = 'SELECT * FROM contact_messages WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};
