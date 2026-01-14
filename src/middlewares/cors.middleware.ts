import { Request, Response, NextFunction } from 'express';
import { CORS_ORIGIN } from '../config/env';

const cors = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  // Only allow requests from the configured CORS origin
  if (origin === CORS_ORIGIN) {
    res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '3600');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

export default cors;
