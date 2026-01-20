import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const { method, url, ip } = req;

  // Log incoming request
  console.log(`\n[${new Date().toISOString()}] → ${method} ${url}`);
  console.log(`  IP: ${ip}`);
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`  Query: ${JSON.stringify(req.query)}`);
  }
  
  if (method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    const bodyStr = JSON.stringify(req.body);
    const truncated = bodyStr.length > 200 ? bodyStr.substring(0, 200) + '...' : bodyStr;
    console.log(`  Body: ${truncated}`);
  }

  // Intercept the response to log it
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function (data: any) {
    const duration = Date.now() - startTime;
    console.log(`  ← ${res.statusCode} (${duration}ms)`);
    return originalJson(data);
  };

  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    console.log(`  ← ${res.statusCode} (${duration}ms)`);
    return originalSend(data);
  };

  next();
};

export default requestLogger;
