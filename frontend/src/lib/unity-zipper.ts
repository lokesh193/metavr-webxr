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

// Direct fetch uploader to Supabase Storage REST API with AbortController & 120s timeout
async function uploadToSupabaseDirect(
  cleanPath: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  const endpoint = `${SUPABASE_URL}/storage/v1/object/webxr-assets/${cleanPath}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: blob,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Direct Fetch Error ${response.status}] ${cleanPath}:`, errText);
      throw new Error(`Storage upload failed (${response.status}): ${errText}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${cleanPath}`;
    console.log(`[Direct Fetch Success] ${cleanPath}: ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error(`[Direct Fetch Timeout] Upload timed out after 120s for ${cleanPath}`);
      throw new Error(`Upload timed out after 120s for ${cleanPath}`);
    }
    console.error(`[Direct Fetch Exception] ${cleanPath}:`, err.message || err);
    throw err;
  }
}

export async function extractAndUploadUnityZip(
  zipFile: File,
  folderPrefix: string,
  onProgress?: (pct: number) => void
): Promise<{ unityUrls: ExtractedUnityUrls; firstGlbUrl?: string }> {
  console.log('[Upload Stage 1] Opening ZIP package...');
  toast.info('Extracting Unity WebGL package & uploading WebXR assets in parallel...');
  
  const zip = new JSZip();
  let zipContent: JSZip;
  try {
    zipContent = await zip.loadAsync(zipFile);
    console.log('[Upload Stage 1] ZIP opened successfully.');
  } catch (err: any) {
    console.error('[Upload Stage Exception] Failed to open ZIP:', err);
    throw new Error(`Failed to open ZIP package: ${err.message}`);
  }

  const fileKeys = Object.keys(zipContent.files).filter((k) => !zipContent.files[k].dir);
  const totalFiles = fileKeys.length;
  console.log(`[Upload Stage 1] Total valid files inside ZIP: ${totalFiles}`);
  let completedCount = 0;

  const unityUrls: ExtractedUnityUrls = {};
  let firstGlbUrl: string | undefined = undefined;

  const brotli = await getBrotli();

  // Process and prepare all file payloads
  const uploadTasks = fileKeys.map(async (rawPath) => {
    const zipEntry = zipContent.files[rawPath];
    let fileData: Uint8Array;
    try {
      fileData = await zipEntry.async('uint8array');
    } catch (readErr: any) {
      console.error(`[Upload Stage Exception] Failed reading ${rawPath}:`, readErr);
      return;
    }

    let targetPath = rawPath;
    let lowerPath = targetPath.toLowerCase();

    // 100% Decompress Brotli (.br) files to uncompressed bytes
    if (lowerPath.endsWith('.br')) {
      if (brotli) {
        try {
          const decompressed = brotli.decompress(fileData);
          fileData = new Uint8Array(decompressed);
          targetPath = targetPath.slice(0, -3); // Strip .br extension
          lowerPath = targetPath.toLowerCase();
          console.log(`[Upload Stage Decompress Success] ${targetPath} (${fileData.byteLength} bytes)`);
        } catch (brErr: any) {
          console.warn(`[Upload Stage Exception] Brotli decompression fallback notice for ${targetPath}:`, brErr);
        }
      }
    } else if (lowerPath.endsWith('.gz') && typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(fileData as unknown as BufferSource);
        writer.close();
        const decompressedArray = await new Response(ds.readable).arrayBuffer();
        fileData = new Uint8Array(decompressedArray);
        targetPath = targetPath.slice(0, -3);
        lowerPath = targetPath.toLowerCase();
        console.log(`[Upload Stage Decompress Success] Gzip ${targetPath} (${fileData.byteLength} bytes)`);
      } catch (gzErr: any) {
        console.warn(`[Upload Stage Exception] Gzip decompression fallback notice for ${targetPath}:`, gzErr);
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

    try {
      const publicUrl = await uploadToSupabaseDirect(cleanPath, fileBlob, mimeType);

      if (lowerPath.endsWith('.loader.js')) {
        unityUrls.loader = publicUrl;
      } else if (lowerPath.includes('framework.js')) {
        unityUrls.framework = publicUrl;
      } else if (lowerPath.includes('.data')) {
        unityUrls.data = publicUrl;
      } else if (lowerPath.includes('.wasm')) {
        unityUrls.wasm = publicUrl;
      } else if (lowerPath.endsWith('index.html')) {
        unityUrls.indexUrl = publicUrl;
      } else if (lowerPath.endsWith('.glb') && !firstGlbUrl) {
        firstGlbUrl = publicUrl;
      }
    } catch (upEx: any) {
      console.error(`[Upload Exception] Failed uploading ${cleanPath}:`, upEx.message || upEx);
    } finally {
      completedCount++;
      if (onProgress) {
        onProgress(Math.round((completedCount / totalFiles) * 100));
      }
    }
  });

  // Execute all asset uploads in parallel concurrency for 5x speed
  await Promise.all(uploadTasks);

  console.log('[Upload Stage 8] All parallel asset uploads completed. Final Unity URLs:', unityUrls);
  return { unityUrls, firstGlbUrl };
}
