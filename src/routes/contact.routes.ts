import { Router } from 'express';
import { validateRequest } from '../middlewares/validate.middleware';
import { submitContactMessage } from '../controllers/contact.controller';
import { z } from 'zod';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  message: z.string().min(1, 'Message is required'),
});

router.post(
  '/',
  validateRequest(contactSchema),
  submitContactMessage
);

export default router;
