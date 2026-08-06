import JSZip from 'jszip';
import brotliPromise from 'brotli-wasm';
import { UnityUrls } from '@/types';

export interface ExtractedUnityPackage {
  projectId: string;
  title: string;
  type: 'UNITY' | 'MODEL';
  unityUrls: UnityUrls;
  glbUrl?: string;
}

function openBuildsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window not available'));
    const request = indexedDB.open('METAVR_BUILDS_DB', 1);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('build_binaries')) {
        db.createObjectStore('build_binaries');
      }
    };

    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e) => reject(e);
  });
}

export async function saveBuildToIndexedDB(
  projectId: string,
  data: {
    loader?: ArrayBuffer;
    framework?: ArrayBuffer;
    data?: ArrayBuffer;
    wasm?: ArrayBuffer;
    indexHtmlText?: string;
  }
): Promise<void> {
  try {
    const db = await openBuildsDB();
    const tx = db.transaction('build_binaries', 'readwrite');
    const store = tx.objectStore('build_binaries');
    store.put(data, projectId);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to save binaries to IndexedDB:', err);
  }
}

export async function restoreUrlsFromIndexedDB(projectId: string): Promise<UnityUrls | null> {
  try {
    const db = await openBuildsDB();
    const tx = db.transaction('build_binaries', 'readonly');
    const store = tx.objectStore('build_binaries');
    const request = store.get(projectId);

    const record = await new Promise<any>((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });

    if (!record) return null;

    let loaderUrl = '';
    let frameworkUrl = '';
    let dataUrl = '';
    let wasmUrl = '';

    if (record.loader) {
      const blob = new Blob([record.loader], { type: 'application/javascript' });
      loaderUrl = URL.createObjectURL(blob);
    }
    if (record.framework) {
      const blob = new Blob([record.framework], { type: 'application/javascript' });
      frameworkUrl = URL.createObjectURL(blob);
    }
    if (record.data) {
      const blob = new Blob([record.data], { type: 'application/octet-stream' });
      dataUrl = URL.createObjectURL(blob);
    }
    if (record.wasm) {
      const blob = new Blob([record.wasm], { type: 'application/wasm' });
      wasmUrl = URL.createObjectURL(blob);
    }

    let indexUrl = '';
    if (record.indexHtmlText) {
      let html = record.indexHtmlText;
      if (loaderUrl) html = html.replace(/src="[^"]*\.loader\.js"/g, `src="${loaderUrl}"`);
      if (frameworkUrl) html = html.replace(/frameworkUrl:\s*[^,\n]+/g, `frameworkUrl: "${frameworkUrl}"`);
      if (dataUrl) html = html.replace(/dataUrl:\s*[^,\n]+/g, `dataUrl: "${dataUrl}"`);
      if (wasmUrl) html = html.replace(/codeUrl:\s*[^,\n]+/g, `codeUrl: "${wasmUrl}"`);

      const htmlBlob = new Blob([html], { type: 'text/html' });
      indexUrl = URL.createObjectURL(htmlBlob);
    }

    return {
      loader: loaderUrl,
      framework: frameworkUrl,
      data: dataUrl,
      wasm: wasmUrl,
      indexUrl: indexUrl || undefined,
    };
  } catch (err) {
    console.warn('Failed to restore binaries from IndexedDB:', err);
    return null;
  }
}

function uint8ToArrayBuffer(uint8: Uint8Array): ArrayBuffer {
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

export async function processZipClientSide(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ExtractedUnityPackage> {
  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const zip = await JSZip.loadAsync(file);
  const brotli = await brotliPromise;

  let loaderBuffer: ArrayBuffer | undefined;
  let frameworkBuffer: ArrayBuffer | undefined;
  let dataBuffer: ArrayBuffer | undefined;
  let wasmBuffer: ArrayBuffer | undefined;
  let indexHtmlText = '';

  let loaderBlobUrl = '';
  let frameworkBlobUrl = '';
  let dataBlobUrl = '';
  let wasmBlobUrl = '';

  const entries = Object.values(zip.files);
  let processedCount = 0;

  for (const entry of entries) {
    if (entry.dir) continue;
    const name = entry.name.toLowerCase();

    if (name.endsWith('index.html')) {
      indexHtmlText = await entry.async('string');
    } else if (name.includes('.loader.js')) {
      loaderBuffer = await entry.async('arraybuffer');
      const blob = new Blob([loaderBuffer], { type: 'application/javascript' });
      loaderBlobUrl = URL.createObjectURL(blob);
    } else if (name.includes('.framework.js') || name.includes('.framework.js.br') || name.includes('.framework.js.gz')) {
      let rawBytes = await entry.async('uint8array');
      if (name.endsWith('.br')) {
        rawBytes = brotli.decompress(rawBytes);
      }
      frameworkBuffer = uint8ToArrayBuffer(rawBytes);
      if (frameworkBuffer) {
        const blob = new Blob([frameworkBuffer], { type: 'application/javascript' });
        frameworkBlobUrl = URL.createObjectURL(blob);
      }
    } else if (name.includes('.data') || name.includes('.data.br') || name.includes('.data.gz')) {
      let rawBytes = await entry.async('uint8array');
      if (name.endsWith('.br')) {
        rawBytes = brotli.decompress(rawBytes);
      }
      dataBuffer = uint8ToArrayBuffer(rawBytes);
      if (dataBuffer) {
        const blob = new Blob([dataBuffer], { type: 'application/octet-stream' });
        dataBlobUrl = URL.createObjectURL(blob);
      }
    } else if (name.includes('.wasm') || name.includes('.wasm.br') || name.includes('.wasm.gz')) {
      let rawBytes = await entry.async('uint8array');
      if (name.endsWith('.br')) {
        rawBytes = brotli.decompress(rawBytes);
      }
      wasmBuffer = uint8ToArrayBuffer(rawBytes);
      if (wasmBuffer) {
        const blob = new Blob([wasmBuffer], { type: 'application/wasm' });
        wasmBlobUrl = URL.createObjectURL(blob);
      }
    }

    processedCount++;
    if (onProgress) {
      onProgress(Math.round((processedCount * 100) / entries.length));
    }
  }

  // Rewrite index.html file paths to decompressed active Blob URLs
  let indexBlobUrl = '';
  if (indexHtmlText) {
    let modifiedHtml = indexHtmlText;

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
  }

  // Save raw decompressed ArrayBuffer binaries to IndexedDB for persistent refresh support
  await saveBuildToIndexedDB(projectId, {
    loader: loaderBuffer,
    framework: frameworkBuffer,
    data: dataBuffer,
    wasm: wasmBuffer,
    indexHtmlText,
  });

  return {
    projectId,
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
