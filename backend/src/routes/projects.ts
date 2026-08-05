import { Router } from 'express';
import { getProjects, getProjectById, toggleLike, updateProject, deleteProject } from '../controllers/projectController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getProjects);
router.get('/:id', optionalAuth, getProjectById);
router.post('/:id/like', authenticate, toggleLike);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
