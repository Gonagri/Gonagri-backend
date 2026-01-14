import { Request, Response, NextFunction } from 'express';
import { addSubscriber } from '../models/subscriber.model';

export const subscribeToWaitlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const subscriber = await addSubscriber(email);
    res.status(201).json({
      success: true,
      data: subscriber,
    });
  } catch (error) {
    next(error);
  }
};
