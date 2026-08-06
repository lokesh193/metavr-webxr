import JSZip from 'jszip';
import brotliWasm from 'brotli-wasm';
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
  if (!brotliInstance) {
    try {
      brotliInstance = await brotliWasm;
    } catch (e) {
      console.warn('[unity-zipper] Failed to initialize brotli-wasm:', e);
    }
  }
  return brotliInstance;
}

export async function extractAndUploadUnityZip(
  zipFile: File,
  folderPrefix: string,
  onProgress?: (pct: number) => void
): Promise<{ unityUrls: ExtractedUnityUrls; firstGlbUrl?: string }> {
  toast.info('Extracting Unity WebGL package & decompressing Brotli assets...');
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(zipFile);

  const files = Object.keys(zipContent.files);
  const totalFiles = files.length;
  let processed = 0;

  const unityUrls: ExtractedUnityUrls = {};
  let firstGlbUrl: string | undefined = undefined;

  const brotli = await getBrotli();

  for (let rawPath of files) {
    const zipEntry = zipContent.files[rawPath];
    if (zipEntry.dir) continue;

    let fileData: Uint8Array = await zipEntry.async('uint8array');
    let targetPath = rawPath;
    let lowerPath = targetPath.toLowerCase();

    // Approach B: Decompress .br files before upload to guarantee 100% cloud & browser compatibility
    if (lowerPath.endsWith('.br') && brotli) {
      try {
        fileData = brotli.decompress(fileData);
        targetPath = targetPath.slice(0, -3); // Strip .br extension
        lowerPath = targetPath.toLowerCase();
        console.log(`[unity-zipper] Successfully decompressed Brotli asset: ${targetPath}`);
      } catch (brErr) {
        console.warn(`[unity-zipper] Brotli decompression fallback notice for ${targetPath}:`, brErr);
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
        console.log(`[unity-zipper] Successfully decompressed Gzip asset: ${targetPath}`);
      } catch (gzErr) {
        console.warn(`[unity-zipper] Gzip decompression fallback notice for ${targetPath}:`, gzErr);
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

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('webxr-assets')
      .upload(cleanPath, fileData, {
        upsert: true,
        contentType: mimeType,
      });

    if (!uploadErr) {
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
    } else {
      console.warn(`[unity-zipper Upload Notice] ${cleanPath}:`, uploadErr.message);
    }

    processed++;
    if (onProgress) {
      onProgress(Math.round((processed / totalFiles) * 100));
    }
  }

  console.log('[unity-zipper] Extracted & Decompressed Unity WebGL URLs:', unityUrls);
  return { unityUrls, firstGlbUrl };
}
