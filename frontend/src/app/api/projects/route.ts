import { NextResponse } from 'next/server';

const defaultProjects = [
  {
    id: 'cmsg96l66000ckded5qlbbupd',
    title: 'Duck 3D WebXR Model',
    description: 'Interactive 6DOF WebXR GLTF 3D Asset',
    type: 'MODEL',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    views: 128,
    likesCount: 34,
    createdAt: new Date().toISOString(),
    user: { id: 'cmsg96l66000ckded5qlbbupd', name: 'WebXR Creator', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
  },
  {
    id: 'proj_sample_unity_vr_01',
    title: 'Cyberpunk VR City Showcase',
    description: 'High performance Unity WebGL & WebXR 6DOF immersive scene',
    type: 'MODEL',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
    thumbnail: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&w=800&q=80',
    views: 245,
    likesCount: 89,
    createdAt: new Date().toISOString(),
    user: { id: 'cmsg96l66000ckded5qlbbupd', name: 'MetaVR Studio', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80' },
  },
];

export async function GET(req: Request) {
  try {
    const customProjects = (globalThis as any).__METAVR_PROJECTS__ || [];
    const allProjects = [...customProjects, ...defaultProjects];

    const formatted = allProjects.map((p) => ({
      ...p,
      unityUrls: typeof p.unityUrls === 'string' ? JSON.parse(p.unityUrls) : p.unityUrls,
    }));

    return NextResponse.json({
      data: formatted,
      pagination: {
        total: formatted.length,
        page: 1,
        limit: 24,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid project data' }, { status: 400 });
    }

    if (!(globalThis as any).__METAVR_PROJECTS__) {
      (globalThis as any).__METAVR_PROJECTS__ = [];
    }

    // Unshift to place newest uploaded project at top of cloud catalog
    (globalThis as any).__METAVR_PROJECTS__.unshift(body);

    return NextResponse.json({ success: true, data: body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save project' }, { status: 500 });
  }
}
