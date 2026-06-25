import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const days = await prisma.day.findMany({
    orderBy: { id: 'asc' },
    include: { topics: { orderBy: { id: 'asc' } } },
  });
  return NextResponse.json(days);
}