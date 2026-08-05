import { Router } from 'express';
import { trackEvent } from '../controllers/analyticsController';

const router = Router();

router.post('/event', trackEvent);

export default router;
