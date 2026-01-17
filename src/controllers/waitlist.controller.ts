import { Request, Response, NextFunction } from 'express';
import { addSubscriber } from '../models/subscriber.model';

/**
 * Subscribe an email address to the waitlist
 * 
 * POST /v1/waitlist/
 * 
 * @param req - Express request with validated email in body
 * @param res - Express response
 * @param next - Express next function for error handling
 */
export const subscribeToWaitlist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    // Add subscriber to database
    const subscriber = await addSubscriber(email);

    // Return success response
    res.status(201).json({
      success: true,
      data: subscriber,
    });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};
