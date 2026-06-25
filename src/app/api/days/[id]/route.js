import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth';

export async function PATCH(req, { params }) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const { note } = await req.json();
  const day = await prisma.day.update({
    where: { id: Number(id) },
    data: { note },
  });
  return NextResponse.json(day);
}