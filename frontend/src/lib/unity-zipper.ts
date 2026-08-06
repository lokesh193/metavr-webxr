import JSZip from 'jszip';
import { toast } from 'sonner';

export interface ExtractedUnityUrls {
  loader?: string;
  framework?: string;
  data?: string;
  wasm?: string;
  indexUrl?: string;
}

const SUPABASE_URL = 'https://sswulpqcabktapawrkpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_paptoQFNQEfleoGLclPgWw_C7udk9dd';

let brotliInstance: any = null;

async function getBrotli() {
  if (typeof window === 'undefined') return null;
  if (!brotliInstance) {
    try {
      const brotliModule = await import('brotli-wasm');
      brotliInstance = await brotliModule.default;
    } catch (e) {
      console.warn('[unity-zipper] Dynamic brotli-wasm import notice:', e);
    }
  }
  return brotliInstance;
}

// Direct REST uploader without short timeouts (supports large 15-50MB binary files over slow networks)
async function uploadToSupabaseDirect(
  cleanPath: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  const endpoint = `${SUPABASE_URL}/storage/v1/object/webxr-assets/${cleanPath}`;

  try {
    console.log(`[Upload Stage Start] Uploading ${cleanPath} (${blob.size} bytes)...`);
    console.time(`Upload: ${cleanPath}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': mimeType,
        'x-upsert': 'true',
        'cache-control': 'public, max-age=31536000, immutable',
      },
      body: blob,
    });
    console.timeEnd(`Upload: ${cleanPath}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Upload Error ${response.status}] ${cleanPath}:`, errText);
      throw new Error(`Storage upload failed (${response.status}): ${errText}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${cleanPath}`;
    console.log(`[Upload Stage Complete] ${cleanPath}: ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    console.timeEnd(`Upload: ${cleanPath}`);
    console.error(`[Upload Exception] ${cleanPath}:`, err.message || err);
    throw err;
  }
}

export async function extractAndUploadUnityZip(
  zipFile: File,
  folderPrefix: string,
  onProgress?: (pct: number) => void
): Promise<{ unityUrls: ExtractedUnityUrls; firstGlbUrl?: string }> {
  // Stage 1: Reading ZIP (10%)
  if (onProgress) onProgress(10);
  console.log('[Stage 10%] Reading ZIP package...');
  console.time('1. ZIP extraction completed');
  
  const zip = new JSZip();
  let zipContent: JSZip;
  try {
    zipContent = await zip.loadAsync(zipFile);
    console.timeEnd('1. ZIP extraction completed');
  } catch (err: any) {
    console.timeEnd('1. ZIP extraction completed');
    console.error('[Stage 1 Exception] Failed to read ZIP:', err);
    throw new Error(`Failed to read ZIP package: ${err.message}`);
  }

  // Stage 2: Extracting files (20%)
  if (onProgress) onProgress(20);
  console.log('[Stage 20%] Extracting files...');
  console.time('2. File extraction completed');

  const fileKeys = Object.keys(zipContent.files).filter((k) => !zipContent.files[k].dir);
  const totalFiles = fileKeys.length;
  console.log(`[Stage 20%] Discovered ${totalFiles} valid files inside ZIP archive.`);
  console.timeEnd('2. File extraction completed');

  // Stage 3: Decompressing Brotli (40%)
  if (onProgress) onProgress(40);
  console.log('[Stage 40%] Decompressing Brotli assets...');
  console.time('3. Brotli decompression completed');

  const brotli = await getBrotli();
  console.timeEnd('3. Brotli decompression completed');

  // Stage 4: Preparing Unity build (60%)
  if (onProgress) onProgress(60);
  console.log('[Stage 60%] Preparing Unity build & mapping assets...');
  console.time('4. File mapping & Metadata generation completed');

  const unityUrls: ExtractedUnityUrls = {};
  let firstGlbUrl: string | undefined = undefined;

  const processedPayloads: Array<{ cleanPath: string; blob: Blob; mimeType: string; rawPath: string }> = [];

  for (const rawPath of fileKeys) {
    const zipEntry = zipContent.files[rawPath];
    let fileData: Uint8Array;
    try {
      fileData = await zipEntry.async('uint8array');
    } catch (readErr: any) {
      console.error(`[Extraction Error] Failed reading ${rawPath}:`, readErr);
      continue;
    }

    let targetPath = rawPath;
    let lowerPath = targetPath.toLowerCase();

    // 100% Decompress Brotli (.br) files to uncompressed bytes (strips .br extension)
    if (lowerPath.endsWith('.br')) {
      if (brotli) {
        try {
          const decompressed = brotli.decompress(fileData);
          fileData = new Uint8Array(decompressed);
          targetPath = targetPath.slice(0, -3);
          lowerPath = targetPath.toLowerCase();
          console.log(`[Brotli Decompressed] ${targetPath} (${fileData.byteLength} bytes)`);
        } catch (brErr: any) {
          console.warn(`[Brotli Warning] Decompression notice for ${targetPath}:`, brErr);
        }
      }
    }

    let mimeType = 'application/octet-stream';
    if (lowerPath.includes('.js') || lowerPath.endsWith('.loader.js') || lowerPath.endsWith('.framework.js')) {
      mimeType = 'application/javascript';
    } else if (lowerPath.endsWith('.html')) {
      mimeType = 'text/html';
    } else if (lowerPath.endsWith('.css')) {
      mimeType = 'text/css';
    } else if (lowerPath.includes('.wasm')) {
      mimeType = 'application/wasm';
    } else if (lowerPath.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (lowerPath.endsWith('.glb')) {
      mimeType = 'model/gltf-binary';
    }

    const cleanPath = `${folderPrefix}/${targetPath.replace(/\\/g, '/')}`;
    const fileBlob = new Blob([fileData as unknown as BlobPart], { type: mimeType });

    processedPayloads.push({ cleanPath, blob: fileBlob, mimeType, rawPath });

    const pathLower = cleanPath.toLowerCase();
    const rawLower = rawPath.toLowerCase();
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${cleanPath}`;

    if (pathLower.endsWith('.loader.js') || rawLower.endsWith('.loader.js')) {
      unityUrls.loader = publicUrl;
    }
    if (pathLower.includes('framework.js') || rawLower.includes('framework.js')) {
      unityUrls.framework = publicUrl;
    }
    if (pathLower.includes('.data') || rawLower.includes('.data')) {
      unityUrls.data = publicUrl;
    }
    if (pathLower.includes('.wasm') || rawLower.includes('.wasm')) {
      unityUrls.wasm = publicUrl;
    }
    if (pathLower.endsWith('index.html') || rawLower.endsWith('index.html')) {
      unityUrls.indexUrl = publicUrl;
    }
    if ((pathLower.endsWith('.glb') || rawLower.endsWith('.glb')) && !firstGlbUrl) {
      firstGlbUrl = publicUrl;
    }
  }
  console.timeEnd('4. File mapping & Metadata generation completed');

  // Stage 5: Uploading files (80%)
  if (onProgress) onProgress(80);
  console.log('[Stage 80%] Uploading files to Supabase Cloud Storage...');
  console.time('5. Upload completed');

  let uploadedCount = 0;
  const uploadTasks = processedPayloads.map(async (item) => {
    try {
      await uploadToSupabaseDirect(item.cleanPath, item.blob, item.mimeType);
    } catch (err: any) {
      console.error(`[Upload Task Error] ${item.cleanPath}:`, err.message || err);
      throw err;
    } finally {
      uploadedCount++;
      const uploadPct = 80 + Math.floor((uploadedCount / processedPayloads.length) * 9);
      if (onProgress) onProgress(uploadPct);
    }
  });

  // Await upload tasks naturally to completion without 10s timeouts
  await Promise.all(uploadTasks);
  console.timeEnd('5. Upload completed');

  return { unityUrls, firstGlbUrl };
}
