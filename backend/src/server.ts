import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { logger } from './utils/logger';

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`🚀 VR Platform Backend API running on http://${HOST}:${PORT}`);
  logger.info(`🥽 WebXR asset streaming & security endpoints ready`);
});
