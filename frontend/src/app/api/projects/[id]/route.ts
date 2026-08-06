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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;

  try {
    const { error } = await supabase.from('Project').delete().eq('id', projectId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;

  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('Project')
      .update({
        title: body.title,
        description: body.description,
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
