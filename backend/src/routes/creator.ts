import { Router } from 'express';
import { getCreatorProfile, toggleFollowCreator } from '../controllers/creatorController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/:id', optionalAuth, getCreatorProfile);
router.post('/:id/follow', authenticate, toggleFollowCreator);

export default router;
