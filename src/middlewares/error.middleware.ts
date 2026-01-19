import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { NODE_ENV } from '../config/env';

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal Server Error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else {
    console.error('[Unhandled Error]', err);
  }

  console.error(`[${code}] ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
