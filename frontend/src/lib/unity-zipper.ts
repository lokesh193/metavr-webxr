import JSZip from 'jszip';
import { supabase } from '@/lib/supabase-client';
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

// Direct XHR upload to Supabase Storage REST API with progress tracking & guaranteed resolution
function uploadToSupabaseDirect(
  cleanPath: string,
  fileData: ArrayBuffer,
  mimeType: string,
  onFileProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpointUrl = `${SUPABASE_URL}/storage/v1/object/webxr-assets/${cleanPath}`;

    xhr.open('POST', endpointUrl, true);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_KEY}`);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.timeout = 120000; // 2 minute timeout for large 20MB+ files

    if (xhr.upload && onFileProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          onFileProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${cleanPath}`;
        console.log(`[XHR Upload Success ${xhr.status}] ${cleanPath}`);
        resolve(publicUrl);
      } else {
        const errText = xhr.responseText || `HTTP ${xhr.status} ${xhr.statusText}`;
        console.error(`[XHR Upload Error ${xhr.status}] ${cleanPath}:`, errText);
        reject(new Error(`Storage upload failed (${xhr.status}): ${errText}`));
      }
    };

    xhr.onerror = () => {
      console.error(`[XHR Upload Network Error] ${cleanPath}`);
      reject(new Error(`Network error uploading file to Supabase Storage.`));
    };

    xhr.ontimeout = () => {
      console.error(`[XHR Upload Timeout] ${cleanPath} after 120s`);
      reject(new Error(`Upload timed out after 120s for ${cleanPath}.`));
    };

    console.log(`[XHR Upload Starting] ${cleanPath} (${fileData.byteLength} bytes)`);
    xhr.send(fileData);
  });
}

export async function extractAndUploadUnityZip(
  zipFile: File,
  folderPrefix: string,
  onProgress?: (pct: number) => void
): Promise<{ unityUrls: ExtractedUnityUrls; firstGlbUrl?: string }> {
  console.log('[Upload Stage 1] Opening ZIP package...');
  toast.info('Extracting Unity WebGL package & decompressing Brotli assets...');
  
  const zip = new JSZip();
  let zipContent: JSZip;
  try {
    zipContent = await zip.loadAsync(zipFile);
    console.log('[Upload Stage 1] ZIP opened successfully.');
  } catch (err: any) {
    console.error('[Upload Stage Exception] Failed to open ZIP:', err);
    throw new Error(`Failed to open ZIP package: ${err.message}`);
  }

  const files = Object.keys(zipContent.files);
  const totalFiles = files.length;
  console.log(`[Upload Stage 1] Total files inside ZIP: ${totalFiles}`);
  let processed = 0;

  const unityUrls: ExtractedUnityUrls = {};
  let firstGlbUrl: string | undefined = undefined;

  const brotli = await getBrotli();

  for (let rawPath of files) {
    const zipEntry = zipContent.files[rawPath];
    if (zipEntry.dir) continue;

    console.log(`[Upload Stage 2] File discovered: ${rawPath}`);

    let fileData: Uint8Array;
    try {
      fileData = await zipEntry.async('uint8array');
    } catch (readErr: any) {
      console.error(`[Upload Stage Exception] Failed reading ${rawPath}:`, readErr);
      continue;
    }

    let targetPath = rawPath;
    let lowerPath = targetPath.toLowerCase();

    // Decompress Brotli (.br) files safely
    if (lowerPath.endsWith('.br')) {
      if (lowerPath.includes('.data')) {
        console.log(`[Upload Stage 3] Decompressing data.br (${rawPath})...`);
      } else if (lowerPath.includes('framework.js')) {
        console.log(`[Upload Stage 4] Decompressing framework.js.br (${rawPath})...`);
      } else if (lowerPath.includes('.wasm')) {
        console.log(`[Upload Stage 5] Decompressing wasm.br (${rawPath})...`);
      }

      if (brotli) {
        try {
          const decompressedWasm = brotli.decompress(fileData);
          fileData = new Uint8Array(decompressedWasm);
          targetPath = targetPath.slice(0, -3); // Strip .br extension
          lowerPath = targetPath.toLowerCase();
          console.log(`[Upload Stage Decompress Success] ${targetPath} (${fileData.byteLength} bytes)`);
        } catch (brErr: any) {
          console.error(`[Upload Stage Exception] Brotli decompression failed for ${targetPath}:`, brErr);
        }
      }
    } else if (lowerPath.endsWith('.gz') && typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(fileData.buffer as ArrayBuffer);
        writer.close();
        const decompressedArray = await new Response(ds.readable).arrayBuffer();
        fileData = new Uint8Array(decompressedArray);
        targetPath = targetPath.slice(0, -3);
        lowerPath = targetPath.toLowerCase();
        console.log(`[Upload Stage Decompress Success] Gzip ${targetPath} (${fileData.byteLength} bytes)`);
      } catch (gzErr: any) {
        console.error(`[Upload Stage Exception] Gzip decompression failed for ${targetPath}:`, gzErr);
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

    // Slice array view into clean ArrayBuffer to guarantee proper transfer
    const cleanArrayBuffer = fileData.buffer.slice(
      fileData.byteOffset,
      fileData.byteOffset + fileData.byteLength
    ) as ArrayBuffer;

    console.log(`[Upload Stage 6] Queue upload for ${cleanPath}`);
    console.log(`[Upload Diagnostics] Buffer Size: ${cleanArrayBuffer.byteLength} bytes, MIME: ${mimeType}`);

    try {
      console.log(`[Upload Stage 7] Uploading file ${cleanPath}...`);
      console.time(`XHR upload: ${cleanPath}`);

      const publicUrl = await uploadToSupabaseDirect(
        cleanPath,
        cleanArrayBuffer,
        mimeType,
        (filePct) => {
          const totalPct = Math.round(((processed + filePct / 100) / totalFiles) * 100);
          if (onProgress) onProgress(totalPct);
        }
      );

      console.timeEnd(`XHR upload: ${cleanPath}`);
      console.log(`[Upload Stage 8] Upload complete for ${cleanPath}: ${publicUrl}`);

      if (lowerPath.endsWith('.loader.js')) {
        unityUrls.loader = publicUrl;
      } else if (lowerPath.includes('framework.js')) {
        unityUrls.framework = publicUrl;
      } else if (lowerPath.endsWith('.data')) {
        unityUrls.data = publicUrl;
      } else if (lowerPath.endsWith('.wasm')) {
        unityUrls.wasm = publicUrl;
      } else if (lowerPath.endsWith('index.html')) {
        unityUrls.indexUrl = publicUrl;
      } else if (lowerPath.endsWith('.glb') && !firstGlbUrl) {
        firstGlbUrl = publicUrl;
      }
    } catch (upEx: any) {
      console.timeEnd(`XHR upload: ${cleanPath}`);
      console.error(`[Upload Stage Exception] Upload failed for ${cleanPath}:`, upEx.message || upEx);
      toast.error(`Upload error for ${cleanPath}: ${upEx.message}`);
    }

    processed++;
    if (onProgress) {
      onProgress(Math.round((processed / totalFiles) * 100));
    }
  }

  console.log('[Upload Stage 8] All ZIP file uploads completed. Extracted Unity URLs:', unityUrls);
  return { unityUrls, firstGlbUrl };
}
