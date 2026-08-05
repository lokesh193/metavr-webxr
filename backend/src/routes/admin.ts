import { Router } from 'express';
import { getAdminStats, getUsers } from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, requireAdmin, getAdminStats);
router.get('/users', authenticate, requireAdmin, getUsers);

export default router;
