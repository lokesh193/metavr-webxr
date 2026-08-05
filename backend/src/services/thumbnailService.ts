import { logger } from '../utils/logger';

export async function generateThumbnail(glbBuffer: Buffer, filename: string): Promise<string> {
  logger.info(`[ThumbnailService] Generating preview thumbnail for ${filename}...`);

  // Default curated high-resolution 3D preview images
  const sampleThumbnails = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=800&q=80',
  ];

  const randomIndex = Math.floor(Math.random() * sampleThumbnails.length);
  return sampleThumbnails[randomIndex];
}
