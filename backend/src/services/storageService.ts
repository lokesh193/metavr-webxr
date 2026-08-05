import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || 'vr-platform-assets';
const CDN_URL = process.env.CDN_URL || 'http://localhost:5000/uploads';

let s3Client: S3Client | null = null;

if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  try {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    logger.info('Cloudflare R2 / AWS S3 Client initialized successfully');
  } catch (err) {
    logger.warn('Failed to initialize S3 client, falling back to local file storage', err);
  }
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<{ key: string; url: string }> {
  const fileExt = path.extname(originalName);
  const fileName = `${Date.now()}-${uuidv4()}${fileExt}`;
  const key = `${folder}/${fileName}`;

  if (s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
      });
      await s3Client.send(command);
      return {
        key,
        url: `${CDN_URL}/${key}`,
      };
    } catch (error) {
      logger.error('S3 upload failed, using local storage fallback:', error);
    }
  }

  // Local Storage Fallback
  const uploadsDir = path.join(__dirname, '../../uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, buffer);

  const localUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${folder}/${fileName}`;
  return {
    key: `${folder}/${fileName}`,
    url: localUrl,
  };
}
