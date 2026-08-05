import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export async function trackEvent(req: Request, res: Response) {
  try {
    const { event, projectId, fps, device, sessionDuration } = req.body;

    logger.info(`[Analytics] Tracked Event: "${event}" for Project: ${projectId || 'N/A'}`, {
      fps: fps || 'N/A',
      device: device || 'WebXR Device',
      sessionDuration: sessionDuration || 0,
    });

    // Plausible Analytics / Sentry integration point
    if (process.env.PLAUSIBLE_DOMAIN) {
      // Forward telemetry to Plausible
    }

    return res.json({ status: 'ok', tracked: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to record analytics' });
  }
}
