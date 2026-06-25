import { prisma } from '../src/lib/prisma.js';

const START_DATE = new Date('2026-06-14');
const TOTAL_DAYS = 45;

async function main() {
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const date = new Date(START_DATE);
    date.setDate(START_DATE.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    await prisma.day.upsert({
      where: { id: i + 1 },
      update: {},
      create: { id: i + 1, date: dateStr, note: '' },
    });
  }
  console.log('Seeded 45 days');
}

main().finally(() => prisma.$disconnect());