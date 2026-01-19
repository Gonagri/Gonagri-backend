import { Router } from 'express';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { submitContactMessage } from '../controllers/contact.controller.js';
import { z } from 'zod';

const router = Router();

/**
 * Zod validation schema for contact message submission
 */
const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase(),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be 5000 characters or less')
    .trim(),
});

/**
 * POST /v1/contact/
 * Submit a contact message from the Coming Soon page
 */
router.post('/', validateRequest(contactSchema), submitContactMessage);

export default router;
