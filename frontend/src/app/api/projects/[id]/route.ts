import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;

  try {
    const { data: project, error } = await supabase
      .from('Project')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let unityUrls = project.unityUrls;
    if (typeof unityUrls === 'string') {
      try {
        unityUrls = JSON.parse(unityUrls);
      } catch (e) {}
    }

    return NextResponse.json({
      ...project,
      unityUrls,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
