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

    // Decompress Brotli (.br) files safely out of WASM heap
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
          // Crucial: Copy out of WASM heap into standard JS ArrayBuffer view to prevent Fetch API locking
          fileData = new Uint8Array(decompressedWasm);
          targetPath = targetPath.slice(0, -3); // Strip .br extension
          lowerPath = targetPath.toLowerCase();
          console.log(`[Upload Stage Decompress Success] ${targetPath}`);
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
        console.log(`[Upload Stage Decompress Success] Gzip ${targetPath}`);
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

    console.log(`[Upload Stage 6] Queue upload for ${cleanPath} (MIME: ${mimeType}, Size: ${fileData.byteLength} bytes)`);

    // Convert Uint8Array to Blob to guarantee clean HTTP stream transmission
    const fileBlob = new Blob([fileData.buffer as ArrayBuffer], { type: mimeType });

    try {
      console.log(`[Upload Stage 7] Uploading file ${cleanPath}...`);
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('webxr-assets')
        .upload(cleanPath, fileBlob, {
          upsert: true,
          contentType: mimeType,
        });

      if (uploadErr) {
        console.error(`[Upload Stage Exception] Supabase upload failed for ${cleanPath}:`, uploadErr.message);
      } else {
        console.log(`[Upload Stage 8] Upload complete for ${cleanPath}`);

        const { data: urlData } = supabase.storage
          .from('webxr-assets')
          .getPublicUrl(cleanPath);

        const publicUrl = urlData.publicUrl;

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
      }
    } catch (upEx: any) {
      console.error(`[Upload Stage Exception] Unexpected exception during upload of ${cleanPath}:`, upEx);
    }

    processed++;
    if (onProgress) {
      onProgress(Math.round((processed / totalFiles) * 100));
    }
  }

  console.log('[Upload Stage 8] All ZIP file uploads completed. Extracted Unity URLs:', unityUrls);
  return { unityUrls, firstGlbUrl };
}
