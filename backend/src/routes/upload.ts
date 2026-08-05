import { Router } from 'express';
import multer from 'multer';
import { processUpload } from '../controllers/uploadController';
import { optionalAuth } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimit';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit for high-poly VR models & Unity builds
  },
});

// Use optionalAuth so guest uploads work seamlessly without forcing explicit login!
router.post('/', optionalAuth, uploadLimiter, upload.array('files', 20), processUpload);

export default router;
