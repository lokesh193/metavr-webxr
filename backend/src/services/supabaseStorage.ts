import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sswulpqcabktapawrkpu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_paptoQFNQEfleoGLclPgWw_C7udk9dd';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET_NAME = 'webxr-assets';

export async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
      });
      logger.info(`[SupabaseStorage] Created public bucket: ${BUCKET_NAME}`);
    }
  } catch (err) {
    logger.warn('[SupabaseStorage] Bucket check notice:', err);
  }
}

export async function uploadToSupabaseStorage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  folder = 'projects'
): Promise<{ key: string; url: string }> {
  await ensureBucketExists();

  const filePath = `${folder}/${Date.now()}_${fileName}`;

  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, fileBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    logger.error('[SupabaseStorage] Upload error:', error);
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return {
    key: filePath,
    url: publicUrlData.publicUrl,
  };
}
