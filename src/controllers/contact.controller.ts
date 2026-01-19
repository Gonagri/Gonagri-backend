import { Request, Response, NextFunction } from 'express';
import { addContactMessage } from '../models/contact.model.js';

/**
 * Submit a contact message from the Coming Soon page
 * 
 * POST /v1/contact/
 * 
 * @param req - Express request with validated name, email, message in body
 * @param res - Express response
 * @param next - Express next function for error handling
 */
export const submitContactMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, message } = req.body;

    // Add contact message to database
    const contact = await addContactMessage(name, email, message);

    // Return success response
    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};
