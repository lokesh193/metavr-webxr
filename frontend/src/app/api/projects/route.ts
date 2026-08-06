import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  try {
    const { data: projects, error } = await supabase
      .from('Project')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (projects || []).map((p) => {
      let unityUrls = p.unityUrls;
      if (typeof unityUrls === 'string') {
        try {
          unityUrls = JSON.parse(unityUrls);
        } catch (e) {}
      }
      return {
        ...p,
        unityUrls,
      };
    });

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = body.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const { data, error } = await supabase
      .from('Project')
      .insert({
        id: projectId,
        title: body.title || 'Untitled Project',
        description: body.description || '',
        userId: body.userId || 'user_demo_creator_123',
        type: body.type || 'MODEL',
        glbUrl: body.glbUrl || null,
        unityUrls: typeof body.unityUrls === 'object' ? JSON.stringify(body.unityUrls) : body.unityUrls,
        thumbnail: body.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        status: 'READY',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
