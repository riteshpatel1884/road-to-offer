import { NextResponse } from 'next/server';
import { getProgress, setProgress } from '../../../lib/db';

// GET is public — anyone visiting the site reads the shared progress.
export async function GET() {
  try {
    const data = await getProgress();
    return NextResponse.json({ days: data });
  } catch (err) {
    console.error('GET /api/progress failed:', err);
    return NextResponse.json({ error: 'Failed to load progress' }, { status: 500 });
  }
}

// POST is gated — only requests with the correct password header can write.
export async function POST(request) {
  try {
    const password = request.headers.get('x-edit-password');

    if (!process.env.EDIT_PASSWORD) {
      console.error('EDIT_PASSWORD env var is not set on the server.');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    if (!password || password !== process.env.EDIT_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || !Array.isArray(body.days)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await setProgress(body.days);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/progress failed:', err);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
