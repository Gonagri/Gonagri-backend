import { Router } from 'express';
import { validateRequest } from '../middlewares/validate.middleware';
import { subscribeToWaitlist } from '../controllers/waitlist.controller';
import { z } from 'zod';

const router = Router();

/**
 * Zod validation schema for waitlist subscription
 */
const subscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase(),
});

/**
 * POST /v1/waitlist/
 * Subscribe email to the waitlist
 */
router.post('/', validateRequest(subscribeSchema), subscribeToWaitlist);

export default router;
