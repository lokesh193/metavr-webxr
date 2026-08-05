import zlib from 'zlib';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { uploadFile } from './storageService';
import { logger } from '../utils/logger';

export interface ExtractedUnityAsset {
  originalPath: string;
  extension: string;
  buffer: Buffer;
}

export interface ExtractedUnityBuild {
  type: 'UNITY' | 'MODEL';
  unityUrls?: {
    indexUrl?: string;
    loader?: string;
    framework?: string;
    data?: string;
    wasm?: string;
  };
  glbUrl?: string;
  error?: string;
}

interface TarEntry {
  name: string;
  size: number;
  dataOffset: number;
}

function parseTarArchive(tarBuffer: Buffer): TarEntry[] {
  const entries: TarEntry[] = [];
  let offset = 0;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);

    if (header.every((b) => b === 0)) break;

    let nameEnd = 0;
    while (nameEnd < 100 && header[nameEnd] !== 0) nameEnd++;
    const name = header.subarray(0, nameEnd).toString('utf8').trim();

    const sizeStr = header.subarray(124, 135).toString('utf8').trim();
    const size = parseInt(sizeStr, 8) || 0;

    const dataOffset = offset + 512;
    if (name && size > 0) {
      entries.push({ name, size, dataOffset });
    }

    const padding = (512 - (size % 512)) % 512;
    offset = dataOffset + size + padding;
  }

  return entries;
}

export async function extractUnityPackage(packageBuffer: Buffer): Promise<ExtractedUnityAsset | null> {
  try {
    logger.info('[UnityExtractor] Decompressing .unitypackage archive...');
    const tarBuffer = zlib.gunzipSync(packageBuffer);
    const entries = parseTarArchive(tarBuffer);

    const guidMap: Map<string, { pathname?: string; assetOffset?: number; assetSize?: number }> = new Map();

    for (const entry of entries) {
      const parts = entry.name.split('/');
      if (parts.length >= 2) {
        const guid = parts[0];
        const filename = parts[1];

        if (!guidMap.has(guid)) {
          guidMap.set(guid, {});
        }

        const record = guidMap.get(guid)!;

        if (filename === 'pathname') {
          const pathText = tarBuffer.subarray(entry.dataOffset, entry.dataOffset + entry.size).toString('utf8').trim();
          record.pathname = pathText;
        } else if (filename === 'asset') {
          record.assetOffset = entry.dataOffset;
          record.assetSize = entry.size;
        }
      }
    }

    const supportedExtensions = ['.fbx', '.obj', '.glb', '.gltf'];
    let bestMatch: { pathname: string; buffer: Buffer } | null = null;
    let largestAsset: { pathname: string; buffer: Buffer; size: number } | null = null;

    for (const [guid, record] of guidMap.entries()) {
      if (record.pathname && record.assetOffset !== undefined && record.assetSize !== undefined) {
        const ext = path.extname(record.pathname).toLowerCase();
        const assetBuffer = tarBuffer.subarray(record.assetOffset, record.assetOffset + record.assetSize);

        if (supportedExtensions.includes(ext)) {
          bestMatch = { pathname: record.pathname, buffer: assetBuffer };
          break;
        }

        if (!largestAsset || record.assetSize > largestAsset.size) {
          largestAsset = { pathname: record.pathname, buffer: assetBuffer, size: record.assetSize };
        }
      }
    }

    const selected = bestMatch || (largestAsset ? { pathname: largestAsset.pathname, buffer: largestAsset.buffer } : null);

    if (selected) {
      const ext = path.extname(selected.pathname).toLowerCase() || '.glb';
      logger.info(`[UnityExtractor] Extracted 3D asset: "${selected.pathname}" (${selected.buffer.length} bytes)`);
      return {
        originalPath: selected.pathname,
        extension: ext,
        buffer: selected.buffer,
      };
    }

    return null;
  } catch (error) {
    logger.error('[UnityExtractor] Failed to unpack .unitypackage:', error);
    return null;
  }
}

// Helper function to find files recursively inside extracted project folder
function findFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Unpack ZIP package PRESERVING EXACT RELATIVE SUBFOLDER STRUCTURE
export async function extractZipPackage(zipBuffer: Buffer, projectId: string): Promise<ExtractedUnityBuild | null> {
  try {
    const projectDir = path.join(__dirname, '../../uploads/projects', projectId);
    logger.info(`[UnityExtractor] Extracting ZIP package for project ${projectId} to filesystem path: ${projectDir}`);

    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(projectDir, true);

    const allFiles = findFilesRecursively(projectDir);
    logger.info(`[UnityExtractor] Extracted ${allFiles.length} files to ${projectDir}`);

    const PORT = process.env.PORT || 5000;
    const baseUrl = `http://localhost:${PORT}/uploads/projects/${projectId}`;

    let indexFile: string | null = null;
    let loaderFile: string | null = null;
    let frameworkFile: string | null = null;
    let dataFile: string | null = null;
    let wasmFile: string | null = null;
    let glbFile: string | null = null;

    for (const fullPath of allFiles) {
      const relativePath = path.relative(projectDir, fullPath).replace(/\\/g, '/');
      const lower = relativePath.toLowerCase();

      if (lower.endsWith('index.html') && !indexFile) {
        indexFile = relativePath;
      }
      if (lower.endsWith('.loader.js') && !loaderFile) {
        loaderFile = relativePath;
      }
      if ((lower.endsWith('.framework.js') || lower.endsWith('.framework.js.br') || lower.endsWith('.framework.js.gz')) && !frameworkFile) {
        frameworkFile = relativePath;
      }
      if ((lower.endsWith('.data') || lower.endsWith('.data.br') || lower.endsWith('.data.gz')) && !dataFile) {
        dataFile = relativePath;
      }
      if ((lower.endsWith('.wasm') || lower.endsWith('.wasm.br') || lower.endsWith('.wasm.gz')) && !wasmFile) {
        wasmFile = relativePath;
      }
      if ((lower.endsWith('.glb') || lower.endsWith('.gltf') || lower.endsWith('.fbx')) && !glbFile) {
        glbFile = relativePath;
      }
    }

    if (loaderFile) {
      logger.info(`[UnityExtractor] Found Unity WebGL build files inside ZIP:`);
      logger.info(` -> index: ${indexFile}`);
      logger.info(` -> loader: ${loaderFile}`);
      logger.info(` -> framework: ${frameworkFile}`);
      logger.info(` -> data: ${dataFile}`);
      logger.info(` -> wasm: ${wasmFile}`);

      return {
        type: 'UNITY',
        unityUrls: {
          indexUrl: indexFile ? `${baseUrl}/${indexFile}` : undefined,
          loader: `${baseUrl}/${loaderFile}`,
          framework: frameworkFile ? `${baseUrl}/${frameworkFile}` : undefined,
          data: dataFile ? `${baseUrl}/${dataFile}` : undefined,
          wasm: wasmFile ? `${baseUrl}/${wasmFile}` : undefined,
        },
      };
    }

    if (glbFile) {
      logger.info(`[UnityExtractor] Found 3D asset file inside ZIP: ${glbFile}`);
      return {
        type: 'MODEL',
        glbUrl: `${baseUrl}/${glbFile}`,
      };
    }

    logger.warn(`[UnityExtractor] Uploaded ZIP archive did not contain Build/*.loader.js or valid 3D assets.`);
    return {
      type: 'UNITY',
      error: 'Invalid Unity WebGL Build ZIP: Missing Build/ directory or *.loader.js entry',
    };
  } catch (error: any) {
    logger.error('[UnityExtractor] Failed to extract ZIP archive:', error);
    return {
      type: 'UNITY',
      error: `ZIP Extraction error: ${error.message}`,
    };
  }
}
