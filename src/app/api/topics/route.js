import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth';

export async function POST(req) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { dayId, text, tag } = await req.json();
  const topic = await prisma.topic.create({
    data: { dayId, text, tag: tag || 'dsa' },
  });
  return NextResponse.json(topic);
}