import JSZip from 'jszip';

export interface ExtractedUnityPackage {
  title: string;
  type: 'UNITY' | 'MODEL';
  unityUrls?: {
    loader: string;
    framework: string;
    data: string;
    wasm: string;
    indexUrl?: string;
  };
  glbUrl?: string;
}

export async function processZipClientSide(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ExtractedUnityPackage> {
  const zip = await JSZip.loadAsync(file);

  let loaderBlobUrl = '';
  let frameworkBlobUrl = '';
  let dataBlobUrl = '';
  let wasmBlobUrl = '';
  let indexHtmlText = '';
  let indexEntry: JSZip.JSZipObject | null = null;

  const entries = Object.values(zip.files);
  let processedCount = 0;

  for (const entry of entries) {
    if (entry.dir) continue;
    const name = entry.name;

    if (name.endsWith('index.html')) {
      indexEntry = entry;
      indexHtmlText = await entry.async('string');
    } else if (name.includes('.loader.js')) {
      const blob = await entry.async('blob');
      loaderBlobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/javascript' }));
    } else if (name.includes('.framework.js')) {
      const blob = await entry.async('blob');
      frameworkBlobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/javascript' }));
    } else if (name.includes('.data')) {
      const blob = await entry.async('blob');
      dataBlobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));
    } else if (name.includes('.wasm')) {
      const blob = await entry.async('blob');
      wasmBlobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/wasm' }));
    }

    processedCount++;
    if (onProgress) {
      onProgress(Math.round((processedCount * 100) / entries.length));
    }
  }

  // If index.html exists, rewrite script & file references to Blob URLs
  let indexBlobUrl = '';
  if (indexHtmlText) {
    let modifiedHtml = indexHtmlText;
    if (loaderBlobUrl) {
      modifiedHtml = modifiedHtml.replace(/src="[^"]*\.loader\.js"/g, `src="${loaderBlobUrl}"`);
    }
    if (frameworkBlobUrl) {
      modifiedHtml = modifiedHtml.replace(/frameworkUrl:\s*"[^"]*"/g, `frameworkUrl: "${frameworkBlobUrl}"`);
    }
    if (dataBlobUrl) {
      modifiedHtml = modifiedHtml.replace(/dataUrl:\s*"[^"]*"/g, `dataUrl: "${dataBlobUrl}"`);
    }
    if (wasmBlobUrl) {
      modifiedHtml = modifiedHtml.replace(/codeUrl:\s*"[^"]*"/g, `codeUrl: "${wasmBlobUrl}"`);
    }

    const htmlBlob = new Blob([modifiedHtml], { type: 'text/html' });
    indexBlobUrl = URL.createObjectURL(htmlBlob);
  }

  return {
    title: file.name.replace(/\.[^/.]+$/, ''),
    type: 'UNITY',
    unityUrls: {
      loader: loaderBlobUrl,
      framework: frameworkBlobUrl,
      data: dataBlobUrl,
      wasm: wasmBlobUrl,
      indexUrl: indexBlobUrl || undefined,
    },
  };
}
