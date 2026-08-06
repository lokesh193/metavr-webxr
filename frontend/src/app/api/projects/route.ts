import { NextResponse } from 'next/server';

const defaultProjects = [
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
        limit: 12,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
  }
}
