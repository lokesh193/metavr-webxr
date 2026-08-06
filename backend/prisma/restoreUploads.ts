import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restore() {
  console.log('🔄 Restoring extracted Unity WebGL projects from disk into database...');

  const projectsDir = path.join(__dirname, '../uploads/projects');
  if (!fs.existsSync(projectsDir)) {
    console.log('No uploads directory found.');
    return;
  }

  // Ensure default demo user exists
  let user = await prisma.user.findFirst({ where: { email: 'user@vrplatform.dev' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'user@vrplatform.dev',
        name: 'WebXR Creator',
        password: 'password123',
        role: 'USER',
      },
    });
  }

  const entries = fs.readdirSync(projectsDir);
  let restoredCount = 0;

  for (const dirName of entries) {
    const dirPath = path.join(projectsDir, dirName);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    // Check if already in DB
    const existing = await prisma.project.findUnique({ where: { id: dirName } });
    if (existing) continue;

    // Find index.html or Build/ folder recursively
    let relIndexUrl: string | null = null;
    let relLoaderUrl: string | null = null;
    let relFrameworkUrl: string | null = null;
    let relDataUrl: string | null = null;
    let relWasmUrl: string | null = null;

    const findFiles = (currentPath: string, relativePath: string) => {
      const files = fs.readdirSync(currentPath);

      for (const file of files) {
        const full = path.join(currentPath, file);
        const rel = path.join(relativePath, file).replace(/\\/g, '/');
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
          findFiles(full, rel);
        } else {
          if (file.toLowerCase() === 'index.html') {
            relIndexUrl = `/uploads/projects/${dirName}/${rel}`;
          } else if (file.includes('.loader.js')) {
            relLoaderUrl = `/uploads/projects/${dirName}/${rel}`;
          } else if (file.includes('.framework.js')) {
            relFrameworkUrl = `/uploads/projects/${dirName}/${rel}`;
          } else if (file.includes('.data')) {
            relDataUrl = `/uploads/projects/${dirName}/${rel}`;
          } else if (file.includes('.wasm')) {
            relWasmUrl = `/uploads/projects/${dirName}/${rel}`;
          }
        }
      }
    };

    findFiles(dirPath, '');

    if (relIndexUrl || relLoaderUrl) {
      const title = `Uploaded Unity Project (${dirName.substring(0, 8)})`;
      await prisma.project.create({
        data: {
          id: dirName,
          title,
          description: 'Original uploaded Unity WebGL 6DOF VR application.',
          userId: user.id,
          type: 'UNITY',
          status: 'READY',
          thumbnail: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=800&q=80',
          unityUrls: JSON.stringify({
            indexUrl: relIndexUrl,
            loader: relLoaderUrl,
            framework: relFrameworkUrl,
            data: relDataUrl,
            wasm: relWasmUrl,
          }),
          views: 100,
          likesCount: 15,
        },
      });
      restoredCount++;
      console.log(`✅ Restored Unity Project [${dirName}] -> ${title}`);
    }
  }

  console.log(`🎉 Successfully restored ${restoredCount} Unity WebGL projects!`);
}

restore()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
