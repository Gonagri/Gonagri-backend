import { Router } from 'express';
import { validateRequest } from '../middlewares/validate.middleware';
import { subscribeToWaitlist } from '../controllers/waitlist.controller';
import { z } from 'zod';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email('Invalid email format'),
});

router.post(
  '/',
  validateRequest(subscribeSchema),
  subscribeToWaitlist
);

export default router;
