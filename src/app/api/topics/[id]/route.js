import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth';

export async function PATCH(req, { params }) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const topic = await prisma.topic.update({
    where: { id: Number(id) },
    data: body,
  });
  return NextResponse.json(topic);
}

export async function DELETE(req, { params }) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await prisma.topic.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}