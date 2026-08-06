import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || 'user@vrplatform.dev';

    return NextResponse.json({
      token: 'demo_guest_jwt_token_metavr_webxr_2026',
      user: {
        id: 'cmsg96l66000ckded5qlbbupd',
        email,
        name: 'WebXR Creator',
        role: 'CREATOR',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}
