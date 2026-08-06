import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Global in-memory storage fallback for Vercel demo showcase
let inMemoryProjects: any[] = [
  {
    id: 'cmsg96l66000ckded5qlbbupd',
    title: 'Sample WebXR 3D Asset',
    description: 'Interactive 6DOF WebXR model',
    type: 'MODEL',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    views: 42,
    likesCount: 12,
    createdAt: new Date().toISOString(),
    user: { id: 'cmsg96l66000ckded5qlbbupd', name: 'WebXR Creator', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
  },
];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const title = (formData.get('title') as string) || 'WebXR Showcase Asset';
    const description = (formData.get('description') as string) || 'Uploaded WebXR Asset';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 });
    }

    const file = files[0];
    const fileName = file.name;
    const ext = path.extname(fileName).toLowerCase();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let projectType: 'MODEL' | 'UNITY' = 'MODEL';
    let glbUrl = '';
    let unityUrls: any = null;

    if (ext === '.zip' || ext === '.unitypackage') {
      projectType = 'UNITY';
      try {
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();

        let hasLoader = false;
        let loaderPath = '';
        let frameworkPath = '';
        let dataPath = '';
        let wasmPath = '';
        let indexPath = '';

        entries.forEach((entry) => {
          const entryName = entry.entryName;
          if (entryName.endsWith('index.html')) indexPath = entryName;
          if (entryName.includes('.loader.js')) {
            hasLoader = true;
            loaderPath = entryName;
          }
          if (entryName.includes('.framework.js')) frameworkPath = entryName;
          if (entryName.includes('.data')) dataPath = entryName;
          if (entryName.includes('.wasm')) wasmPath = entryName;
        });

        if (!hasLoader && !indexPath) {
          return NextResponse.json(
            { error: 'Invalid Unity WebGL package. Build/ folder or .loader.js missing from uploaded archive.' },
            { status: 400 }
          );
        }

        // Generate data URL fallback or public reference URL
        const base64Data = buffer.toString('base64');
        const dataUri = `data:application/zip;base64,${base64Data.substring(0, 1000)}...`;

        unityUrls = {
          loader: loaderPath ? `/api/projects/${projectId}/files/${loaderPath}` : '',
          framework: frameworkPath ? `/api/projects/${projectId}/files/${frameworkPath}` : '',
          data: dataPath ? `/api/projects/${projectId}/files/${dataPath}` : '',
          wasm: wasmPath ? `/api/projects/${projectId}/files/${wasmPath}` : '',
          indexUrl: indexPath ? `/api/projects/${projectId}/files/${indexPath}` : '',
        };
      } catch (err: any) {
        return NextResponse.json({ error: `ZIP Extraction error: ${err.message}` }, { status: 400 });
      }
    } else {
      // Direct 3D Model Asset (.glb, .gltf, .fbx, .obj, .usdz)
      projectType = 'MODEL';
      const base64 = buffer.toString('base64');
      const mime = ext === '.glb' ? 'model/gltf-binary' : 'application/octet-stream';
      glbUrl = `data:${mime};base64,${base64}`;
    }

    const newProject = {
      id: projectId,
      title,
      description,
      type: projectType,
      glbUrl: glbUrl || null,
      unityUrls: unityUrls ? JSON.stringify(unityUrls) : null,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      views: 1,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      user: {
        id: 'cmsg96l66000ckded5qlbbupd',
        name: 'WebXR Creator',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      },
    };

    // Store in global memory array
    (globalThis as any).__METAVR_PROJECTS__ = (globalThis as any).__METAVR_PROJECTS__ || [];
    (globalThis as any).__METAVR_PROJECTS__.unshift(newProject);

    return NextResponse.json(newProject);
  } catch (error: any) {
    console.error('[Next.js Upload Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to process file upload' }, { status: 500 });
  }
}
