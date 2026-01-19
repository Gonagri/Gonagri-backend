import express, { Express } from 'express';
import cors from './middlewares/cors.middleware';
import errorHandler from './middlewares/error.middleware';
import { securityHeaders, apiLimiter, authLimiter } from './middlewares/security.middleware';
import requestLogger from './middlewares/logging.middleware';
import healthRoutes from './routes/health.routes';
import waitlistRoutes from './routes/waitlist.routes';
import contactRoutes from './routes/contact.routes';

const app: Express = express();

// Request logging (must be early)
app.use(requestLogger);

// Security Headers
app.use(securityHeaders);

// Body Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS
app.use(cors);

// Global Rate Limiter
app.use(apiLimiter);

// Routes
app.use('/health', healthRoutes);
app.use('/v1/waitlist', authLimiter, waitlistRoutes);
app.use('/v1/contact', authLimiter, contactRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
