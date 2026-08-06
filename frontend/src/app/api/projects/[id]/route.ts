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
    comments: [],
  },
];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const customProjects = (globalThis as any).__METAVR_PROJECTS__ || [];
    const allProjects = [...customProjects, ...defaultProjects];

    const project = allProjects.find((p) => p.id === id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...project,
      unityUrls: typeof project.unityUrls === 'string' ? JSON.parse(project.unityUrls) : project.unityUrls,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const customProjects = (globalThis as any).__METAVR_PROJECTS__ || [];

    const project = customProjects.find((p: any) => p.id === id);
    if (project) {
      if (body.title) project.title = body.title;
      if (body.description !== undefined) project.description = body.description;
      return NextResponse.json(project);
    }

    return NextResponse.json({ id, title: body.title, description: body.description });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if ((globalThis as any).__METAVR_PROJECTS__) {
      (globalThis as any).__METAVR_PROJECTS__ = (globalThis as any).__METAVR_PROJECTS__.filter((p: any) => p.id !== id);
    }
    return NextResponse.json({ message: 'Project successfully deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete project' }, { status: 500 });
  }
}
