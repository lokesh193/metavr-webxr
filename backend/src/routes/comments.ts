import { Router } from 'express';
import { addComment, deleteComment } from '../controllers/commentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, addComment);
router.delete('/:id', authenticate, deleteComment);

export default router;
