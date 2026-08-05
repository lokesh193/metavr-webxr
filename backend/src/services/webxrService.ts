import { logger } from '../utils/logger';

export interface WebXRProfile {
  targetFps: number;
  recommendedLod: string;
  supportsHandTracking: boolean;
  occlusionCullingEnabled: boolean;
}

export function generateWebXRProfile(fileSizeMb: number, projectType: string): WebXRProfile {
  logger.info(`[WebXRService] Analyzing asset (${fileSizeMb}MB, ${projectType}) for 90 FPS WebXR target...`);

  return {
    targetFps: 90,
    recommendedLod: fileSizeMb > 50 ? 'LOD_HIGH_COMPRESSION' : 'LOD_DIRECT',
    supportsHandTracking: true,
    occlusionCullingEnabled: true,
  };
}
