import express, { Express } from 'express';
import cors from './middlewares/cors.middleware.js';
import errorHandler from './middlewares/error.middleware.js';
import { securityHeaders, apiLimiter, authLimiter } from './middlewares/security.middleware.js';
import healthRoutes from './routes/health.routes.js';
import waitlistRoutes from './routes/waitlist.routes.js';
import contactRoutes from './routes/contact.routes.js';

const app: Express = express();

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