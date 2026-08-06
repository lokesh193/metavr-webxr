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

// Global active blob URL registry to prevent Garbage Collection revocation
const activeBlobRegistry = new Map<string, Blob>();

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

  const entries = Object.values(zip.files);
  let processedCount = 0;

  for (const entry of entries) {
    if (entry.dir) continue;
    const name = entry.name.toLowerCase();

    if (name.endsWith('index.html')) {
      indexHtmlText = await entry.async('string');
    } else if (name.includes('.loader.js')) {
      const blob = await entry.async('blob');
      const jsBlob = new Blob([blob], { type: 'application/javascript' });
      loaderBlobUrl = URL.createObjectURL(jsBlob);
      activeBlobRegistry.set(`loader_${Date.now()}`, jsBlob);
    } else if (name.includes('.framework.js')) {
      const blob = await entry.async('blob');
      const jsBlob = new Blob([blob], { type: 'application/javascript' });
      frameworkBlobUrl = URL.createObjectURL(jsBlob);
      activeBlobRegistry.set(`framework_${Date.now()}`, jsBlob);
    } else if (name.includes('.data')) {
      const blob = await entry.async('blob');
      const dataBlob = new Blob([blob], { type: 'application/octet-stream' });
      dataBlobUrl = URL.createObjectURL(dataBlob);
      activeBlobRegistry.set(`data_${Date.now()}`, dataBlob);
    } else if (name.includes('.wasm')) {
      const blob = await entry.async('blob');
      const wasmBlob = new Blob([blob], { type: 'application/wasm' });
      wasmBlobUrl = URL.createObjectURL(wasmBlob);
      activeBlobRegistry.set(`wasm_${Date.now()}`, wasmBlob);
    }

    processedCount++;
    if (onProgress) {
      onProgress(Math.round((processedCount * 100) / entries.length));
    }
  }

  // Rewrite index.html file paths to active Blob URLs
  let indexBlobUrl = '';
  if (indexHtmlText) {
    let modifiedHtml = indexHtmlText;

    // Inject override script at top of <head>
    const overrideScript = `
      <script>
        window.UNITY_LOADER_URL = "${loaderBlobUrl}";
        window.UNITY_FRAMEWORK_URL = "${frameworkBlobUrl}";
        window.UNITY_DATA_URL = "${dataBlobUrl}";
        window.UNITY_WASM_URL = "${wasmBlobUrl}";
      </script>
    `;

    modifiedHtml = modifiedHtml.replace('<head>', `<head>${overrideScript}`);

    // Replace Unity standard buildUrl / loaderUrl / config definitions
    if (loaderBlobUrl) {
      modifiedHtml = modifiedHtml.replace(/script\.src\s*=\s*[^;]+/g, `script.src = "${loaderBlobUrl}"`);
      modifiedHtml = modifiedHtml.replace(/src="[^"]*\.loader\.js"/g, `src="${loaderBlobUrl}"`);
    }
    if (frameworkBlobUrl) {
      modifiedHtml = modifiedHtml.replace(/frameworkUrl:\s*[^,\n]+/g, `frameworkUrl: "${frameworkBlobUrl}"`);
    }
    if (dataBlobUrl) {
      modifiedHtml = modifiedHtml.replace(/dataUrl:\s*[^,\n]+/g, `dataUrl: "${dataBlobUrl}"`);
    }
    if (wasmBlobUrl) {
      modifiedHtml = modifiedHtml.replace(/codeUrl:\s*[^,\n]+/g, `codeUrl: "${wasmBlobUrl}"`);
    }

    const htmlBlob = new Blob([modifiedHtml], { type: 'text/html' });
    indexBlobUrl = URL.createObjectURL(htmlBlob);
    activeBlobRegistry.set(`index_${Date.now()}`, htmlBlob);
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
