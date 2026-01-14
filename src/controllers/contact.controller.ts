import { Request, Response, NextFunction } from 'express';
import { addContactMessage } from '../models/contact.model';

export const submitContactMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, message } = req.body;
    const contact = await addContactMessage(name, email, message);
    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};
