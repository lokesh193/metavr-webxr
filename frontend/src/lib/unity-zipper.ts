import JSZip from 'jszip';
import { UnityUrls } from '@/types';

export interface ExtractedUnityPackage {
  projectId: string;
  title: string;
  type: 'UNITY' | 'MODEL';
  unityUrls: UnityUrls;
  glbUrl?: string;
}

// Open IndexedDB database for persistent WebGL binary storage across refreshes
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

// Save raw ArrayBuffer binaries to IndexedDB
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

// Restore fresh active Blob URLs from IndexedDB on page load/refresh
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

export async function processZipClientSide(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ExtractedUnityPackage> {
  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const zip = await JSZip.loadAsync(file);

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
    } else if (name.includes('.framework.js')) {
      frameworkBuffer = await entry.async('arraybuffer');
      const blob = new Blob([frameworkBuffer], { type: 'application/javascript' });
      frameworkBlobUrl = URL.createObjectURL(blob);
    } else if (name.includes('.data')) {
      dataBuffer = await entry.async('arraybuffer');
      const blob = new Blob([dataBuffer], { type: 'application/octet-stream' });
      dataBlobUrl = URL.createObjectURL(blob);
    } else if (name.includes('.wasm')) {
      wasmBuffer = await entry.async('arraybuffer');
      const blob = new Blob([wasmBuffer], { type: 'application/wasm' });
      wasmBlobUrl = URL.createObjectURL(blob);
    }

    processedCount++;
    if (onProgress) {
      onProgress(Math.round((processedCount * 100) / entries.length));
    }
  }

  // Save raw ArrayBuffer binaries to IndexedDB for persistent refresh support
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
    },
  };
}
