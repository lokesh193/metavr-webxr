import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 VR Platform Backend API running on http://localhost:${PORT}`);
  logger.info(`🥽 WebXR asset streaming & security endpoints ready`);
});
