import { NextResponse } from 'next/server';

export async function POST(req) {
  const { password } = await req.json();
  const valid = password === process.env.ADMIN_PASSWORD;
  if (!valid) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
  return NextResponse.json({ valid: true });
}