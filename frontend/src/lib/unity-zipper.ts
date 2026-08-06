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

export async function extractAndUploadUnityZip(
  zipFile: File,
  folderPrefix: string,
  onProgress?: (pct: number) => void
): Promise<{ unityUrls: ExtractedUnityUrls; firstGlbUrl?: string }> {
  toast.info('Extracting Unity WebGL ZIP package in browser...');
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(zipFile);

  const files = Object.keys(zipContent.files);
  const totalFiles = files.length;
  let processed = 0;

  const unityUrls: ExtractedUnityUrls = {};
  let firstGlbUrl: string | undefined = undefined;

  for (const relativePath of files) {
    const zipEntry = zipContent.files[relativePath];
    if (zipEntry.dir) continue;

    const fileData = await zipEntry.async('uint8array');
    const lowerPath = relativePath.toLowerCase();

    let mimeType = 'application/octet-stream';
    let contentEncoding: string | undefined = undefined;

    if (lowerPath.endsWith('.br')) {
      contentEncoding = 'br';
    } else if (lowerPath.endsWith('.gz')) {
      contentEncoding = 'gzip';
    }

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

    const cleanPath = `${folderPrefix}/${relativePath.replace(/\\/g, '/')}`;

    const uploadOptions: any = {
      upsert: true,
      contentType: mimeType,
    };
    if (contentEncoding) {
      uploadOptions.contentEncoding = contentEncoding;
    }

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('webxr-assets')
      .upload(cleanPath, fileData, uploadOptions);

    if (!uploadErr) {
      const { data: urlData } = supabase.storage
        .from('webxr-assets')
        .getPublicUrl(cleanPath);

      const publicUrl = urlData.publicUrl;

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
    } else {
      console.warn(`[unity-zipper Upload Warning] ${cleanPath}:`, uploadErr.message);
    }

    processed++;
    if (onProgress) {
      onProgress(Math.round((processed / totalFiles) * 100));
    }
  }

  console.log('[unity-zipper] Extracted Unity WebGL URLs:', unityUrls);
  return { unityUrls, firstGlbUrl };
}
