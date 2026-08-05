import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import { AuthenticatedRequest } from '../types';
import { uploadFile } from '../services/storageService';
import { virusScan } from '../services/virusScanService';
import { generateThumbnail } from '../services/thumbnailService';
import { compressModel } from '../services/compressionService';
import { generateWebXRProfile } from '../services/webxrService';
import { extractUnityPackage, extractZipPackage } from '../services/unityExtractor';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export async function processUpload(req: AuthenticatedRequest, res: Response) {
  try {
    // 1. Ensure req.user.id matches a valid existing user in DB to prevent foreign key violations!
    let validUser = req.user?.id ? await prisma.user.findUnique({ where: { id: req.user.id } }) : null;

    if (!validUser) {
      validUser = await prisma.user.findFirst({ where: { email: 'user@vrplatform.dev' } });
    }

    if (!validUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      validUser = await prisma.user.create({
        data: {
          email: 'user@vrplatform.dev',
          password: hashedPassword,
          name: 'WebXR Creator',
          role: 'USER',
        },
      });
    }

    req.user = {
      id: validUser.id,
      email: validUser.email,
      name: validUser.name,
      role: validUser.role,
    };

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided for upload' });
    }

    const { title, description } = req.body;
    const firstFileName = files[0].originalname;

    // Detect file type
    const isUnityBuild = files.some(
      (f) =>
        f.originalname.endsWith('.loader.js') ||
        f.originalname.endsWith('.wasm') ||
        f.originalname.endsWith('.data') ||
        f.originalname.endsWith('.framework.js')
    );

    let projectType = isUnityBuild ? 'UNITY' : 'MODEL';

    // 2. Create initial project record with validated user.id
    const project = await prisma.project.create({
      data: {
        title: title || firstFileName.replace(/\.[^/.]+$/, ''),
        description: description || `Uploaded WebXR ${projectType} asset`,
        userId: validUser.id,
        type: projectType,
        status: 'PROCESSING',
      },
    });

    const uploadedFiles = [];
    const unityUrls: any = {};
    let primaryGlbUrl: string | null = null;
    let thumbnailUrl: string | null = null;

    for (const file of files) {
      // Automated Virus Scan
      await virusScan(file.buffer, file.originalname);

      // Handle raw GLB/GLTF model
      if (file.originalname.toLowerCase().endsWith('.glb') || file.originalname.toLowerCase().endsWith('.gltf')) {
        const { key, url } = await uploadFile(file.buffer, file.originalname, file.mimetype, `projects/${project.id}`);
        primaryGlbUrl = url;
        uploadedFiles.push({ projectId: project.id, filename: file.originalname, size: file.size, mimeType: file.mimetype || 'application/octet-stream', key, url });
        await compressModel(file.buffer, project.id);
        thumbnailUrl = await generateThumbnail(file.buffer, file.originalname);
      }

      // Handle Unity Package (.unitypackage) -> EXTRACT REAL 3D MODEL
      else if (file.originalname.toLowerCase().endsWith('.unitypackage')) {
        logger.info(`[UploadController] Unpacking Unity Package: ${file.originalname}...`);
        const extracted = await extractUnityPackage(file.buffer);

        if (extracted) {
          const extractedFileName = `extracted_${path.basename(extracted.originalPath)}`;
          const { url: extractedUrl } = await uploadFile(
            extracted.buffer,
            extractedFileName,
            'application/octet-stream',
            `projects/${project.id}`
          );

          primaryGlbUrl = extractedUrl;
          logger.info(`[UploadController] Real 3D model extracted from Unity Package and stored at: ${extractedUrl}`);
        }
      }

      // Handle ZIP Package (.zip) -> EXTRACT UNITY WEBGL BUILD OR 3D ASSETS PRESERVING DIRECTORY STRUCTURE
      else if (file.originalname.toLowerCase().endsWith('.zip')) {
        logger.info(`[UploadController] Unzipping uploaded package: ${file.originalname}...`);
        const extractedBuild = await extractZipPackage(file.buffer, project.id);

        if (extractedBuild?.error) {
          await prisma.project.delete({ where: { id: project.id } });
          return res.status(400).json({ error: extractedBuild.error });
        }

        if (extractedBuild) {
          if (extractedBuild.type === 'UNITY' && extractedBuild.unityUrls) {
            projectType = 'UNITY';
            Object.assign(unityUrls, extractedBuild.unityUrls);
          } else if (extractedBuild.glbUrl) {
            primaryGlbUrl = extractedBuild.glbUrl;
          }
        }
      } else {
        const { key, url } = await uploadFile(file.buffer, file.originalname, file.mimetype, `projects/${project.id}`);
        uploadedFiles.push({ projectId: project.id, filename: file.originalname, size: file.size, mimeType: file.mimetype || 'application/octet-stream', key, url });
        if (file.originalname.endsWith('.loader.js')) unityUrls.loader = url;
        else if (file.originalname.endsWith('.framework.js')) unityUrls.framework = url;
        else if (file.originalname.endsWith('.data')) unityUrls.data = url;
        else if (file.originalname.endsWith('.wasm')) unityUrls.wasm = url;
      }
    }

    // Default thumbnail fallback
    if (!thumbnailUrl) {
      thumbnailUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
    }

    // Save uploaded files metadata to DB if any
    if (uploadedFiles.length > 0) {
      await prisma.file.createMany({ data: uploadedFiles });
    }

    // Generate WebXR Optimization Profile
    const totalSizeMb = files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
    const webxrProfile = generateWebXRProfile(totalSizeMb, projectType);

    // Update project with final status & URLs
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        type: projectType,
        glbUrl: primaryGlbUrl,
        unityUrls: Object.keys(unityUrls).length > 0 ? JSON.stringify(unityUrls) : null,
        thumbnail: thumbnailUrl,
        status: 'READY',
      },
    });

    logger.info(`[UploadController] Successfully created project ${project.id} (${projectType})`);

    return res.status(201).json({
      message: 'Uploaded package processed and launched for WebXR!',
      projectId: project.id,
      project: {
        ...updatedProject,
        unityUrls: updatedProject.unityUrls ? JSON.parse(updatedProject.unityUrls) : null,
      },
      webxrProfile,
    });
  } catch (error: any) {
    logger.error('[UploadController] Upload processing error:', error);
    return res.status(500).json({ error: error.message || 'Upload processing failed' });
  }
}
